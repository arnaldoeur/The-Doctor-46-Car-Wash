<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

start_app_session();
db();

$action = (string) ($_GET['action'] ?? '');
$input = json_input();

try {
 switch ($action) {
 case 'auth.me':
 $user = current_user_row();
 respond_success([
 'user' => $user ? user_to_auth_payload($user) : null,
 'profile' => $user ? user_to_profile_payload($user) : null,
 ]);
 break;

 case 'user.update_language':
 $user = require_auth();
 $lang = trim((string) ($input['language'] ?? ''));
 if ($lang !== 'pt' && $lang !== 'en') {
 respond_error('Idioma invalido.', 422);
 }
 $stmt = db()->prepare('UPDATE users SET preferred_language = :lang WHERE id = :id');
 $stmt->execute(['lang' => $lang, 'id' => $user['id']]);
 respond_success(['language' => $lang]);
 break;

 case 'auth.login':
 $email = normalize_email((string) ($input['email'] ?? ''));
 $password = (string) ($input['password'] ?? '');

 if ($email === '' || $password === '') {
 respond_error('Email e palavra-passe sao obrigatorios.', 422);
 }

 $user = find_user_by_email($email);
 if (!$user || !password_verify($password, (string) $user['password_hash'])) {
 respond_error('Email ou palavra-passe incorretos.', 401);
 }

 $status = $user['status'] ?? 'active';
 if (in_array($status, ['inactive', 'vacation', 'suspended'], true)) {
 respond_error('Esta conta foi desativada ou encontra-se de ferias.', 403);
 }

 $_SESSION['user_id'] = $user['id'];
 $updateLogin = db()->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id');
 $updateLogin->execute(['id' => $user['id']]);
 $user = find_user_by_id((string) $user['id']) ?? $user;

 write_audit_log('auth', 'Login efetuado', 'user', $user['id'], $user['email'], [
 'portal' => is_staff_role($user) ? 'admin' : 'customer',
 ], $user['id']);

 respond_success([
 'user' => user_to_auth_payload($user),
 'profile' => user_to_profile_payload($user),
 ]);
 break;

 case 'auth.register':
 $fullName = trim((string) ($input['fullName'] ?? ''));
 $email = normalize_email((string) ($input['email'] ?? ''));
 $phone = trim((string) ($input['phone'] ?? ''));
 $password = (string) ($input['password'] ?? '');

 if ($fullName === '' || $email === '' || $password === '') {
 respond_error('Nome, email e palavra-passe sao obrigatorios.', 422);
 }

 if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
 respond_error('Introduza um email valido.', 422);
 }

 if (strlen($password) < 6) {
 respond_error('A palavra-passe precisa de ter pelo menos 6 caracteres.', 422);
 }

 if (find_user_by_email($email)) {
 respond_error('Este email ja esta registado.', 409);
 }

 $userId = generate_uuid();
 $stmt = db()->prepare(
 'INSERT INTO users (
 id, full_name, email, phone, password_hash, account_type, role, status
 ) VALUES (
 :id, :full_name, :email, :phone, :password_hash, :account_type, :role, :status
 )'
 );

 $stmt->execute([
 'id' => $userId,
 'full_name' => $fullName,
 'email' => $email,
 'phone' => $phone !== '' ? $phone : null,
 'password_hash' => password_hash($password, PASSWORD_DEFAULT),
 'account_type' => 'customer',
 'role' => 'customer',
 'status' => 'active',
 ]);

 $_SESSION['user_id'] = $userId;
 $user = find_user_by_id($userId);

 write_audit_log('auth', 'Conta criada', 'user', $userId, $email, [
 'account_type' => 'customer',
 ], $userId);

 respond_success([
 'user' => user_to_auth_payload($user),
 'profile' => user_to_profile_payload($user),
 ], 201);
 break;

 case 'auth.logout':
 $current = current_user_row();
 if ($current) {
 write_audit_log('auth', 'Logout efetuado', 'user', $current['id'], $current['email'], [], $current['id']);
 }

 $_SESSION = [];
 if (ini_get('session.use_cookies')) {
 $params = session_get_cookie_params();
 setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
 }
 @session_destroy();
 respond_success(['loggedOut' => true]);
 break;

 case 'public.service_catalog':
 respond_success(fetch_service_catalog(true));
 break;

 case 'customer.profile.save':
 $user = require_auth();
 $fullName = trim((string) ($input['fullName'] ?? $user['full_name'] ?? ''));
 $email = normalize_email((string) ($input['email'] ?? $user['email'] ?? ''));
 $phone = trim((string) ($input['phone'] ?? $user['phone'] ?? ''));

 if ($fullName === '') {
 respond_error('Introduza o seu nome completo.', 422);
 }

 if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
 respond_error('Introduza um email valido.', 422);
 }

 $existing = find_user_by_email($email);
 if ($existing && $existing['id'] !== $user['id']) {
 respond_error('Este email ja esta em uso por outra conta.', 409);
 }

 $stmt = db()->prepare(
 'UPDATE users
 SET full_name = :full_name, email = :email, phone = :phone
 WHERE id = :id'
 );
 $stmt->execute([
 'id' => $user['id'],
 'full_name' => $fullName,
 'email' => $email,
 'phone' => $phone !== '' ? $phone : null,
 ]);

 $updated = find_user_by_id((string) $user['id']);
 write_audit_log('profile', 'Perfil atualizado', 'user', $user['id'], $email, [], $user['id']);
 respond_success(user_to_profile_payload($updated));
 break;

 case 'customer.appointments.list':
 $user = require_auth();
 respond_success(fetch_appointments_for_customer((string) $user['id']));
 break;

 case 'customer.appointment.create':
 $user = require_auth();
 $serviceId = (string) ($input['serviceId'] ?? '');
 $selectedDate = (string) ($input['selectedDate'] ?? '');
 $selectedTime = trim((string) ($input['selectedTime'] ?? ''));
 $vehicleInfo = is_array($input['vehicleInfo'] ?? null) ? $input['vehicleInfo'] : [];
 $personalInfo = is_array($input['personalInfo'] ?? null) ? $input['personalInfo'] : [];

 if ($selectedDate === '' || $selectedTime === '') {
 respond_error('Data e hora sao obrigatorias.', 422);
 }

 $serviceRow = null;
 if ($serviceId !== '') {
 $serviceStmt = db()->prepare('SELECT * FROM service_catalog WHERE id = :id LIMIT 1');
 $serviceStmt->execute(['id' => $serviceId]);
 $serviceRow = $serviceStmt->fetch() ?: null;
 }

 $serviceName = $serviceRow['name'] ?? (string) ($input['serviceName'] ?? 'Servico');
 $servicePriceText = $serviceRow
 ? format_money_text((float) ($serviceRow['is_promotional'] && $serviceRow['promotional_price'] !== null ? $serviceRow['promotional_price'] : $serviceRow['base_price']))
 : (string) ($input['servicePriceText'] ?? '0 MT');
 $serviceDurationText = $serviceRow
 ? duration_to_text($serviceRow['duration_minutes'])
 : ((string) ($input['serviceDurationText'] ?? '') ?: null);

 $appointmentId = generate_uuid();
 $stmt = db()->prepare(
 'INSERT INTO appointments (
 id, customer_id, service_id, service_name, service_price_text, service_duration_text,
 appointment_date, appointment_time, status, vehicle_make, vehicle_model, vehicle_plate,
 contact_name, contact_email, contact_phone, loyalty_points_earned
 ) VALUES (
 :id, :customer_id, :service_id, :service_name, :service_price_text, :service_duration_text,
 :appointment_date, :appointment_time, :status, :vehicle_make, :vehicle_model, :vehicle_plate,
 :contact_name, :contact_email, :contact_phone, :loyalty_points_earned
 )'
 );

 $stmt->execute([
 'id' => $appointmentId,
 'customer_id' => $user['id'],
 'service_id' => $serviceId !== '' ? $serviceId : null,
 'service_name' => $serviceName,
 'service_price_text' => $servicePriceText,
 'service_duration_text' => $serviceDurationText,
 'appointment_date' => $selectedDate,
 'appointment_time' => $selectedTime,
 'status' => 'confirmed',
 'vehicle_make' => trim((string) ($vehicleInfo['make'] ?? '')),
 'vehicle_model' => trim((string) ($vehicleInfo['model'] ?? '')),
 'vehicle_plate' => strtoupper(trim((string) ($vehicleInfo['plate'] ?? ''))),
 'contact_name' => trim((string) ($personalInfo['name'] ?? $user['full_name'] ?? 'Cliente')),
 'contact_email' => trim((string) ($personalInfo['email'] ?? $user['email'] ?? '')) ?: null,
 'contact_phone' => trim((string) ($personalInfo['phone'] ?? $user['phone'] ?? '')),
 'loyalty_points_earned' => calculate_loyalty_points_from_price($servicePriceText),
 ]);

 write_audit_log('appointments', 'Agendamento criado', 'appointment', $appointmentId, $serviceName, [
 'customer_id' => $user['id'],
 'appointment_date' => $selectedDate,
 'appointment_time' => $selectedTime,
 ], $user['id']);

 $appointmentStmt = db()->prepare('SELECT * FROM appointments WHERE id = :id LIMIT 1');
 $appointmentStmt->execute(['id' => $appointmentId]);
 $appointment = $appointmentStmt->fetch();
 respond_success(appointment_payload($appointment), 201);
 break;

 case 'admin.profiles.list':
 require_staff();
 respond_success(fetch_all_profiles());
 break;

 case 'admin.staff.list':
 require_staff();
 $profiles = array_values(array_filter(fetch_all_profiles(), static function (array $profile): bool {
 return ($profile['account_type'] ?? 'customer') === 'staff';
 }));
 respond_success($profiles);
 break;

 case 'admin.staff.create':
 $viewer = require_super_admin();
 $fullName = trim((string) ($input['fullName'] ?? ''));
 $email = normalize_email((string) ($input['email'] ?? ''));
 $password = (string) ($input['password'] ?? '');
 $phone = trim((string) ($input['phone'] ?? ''));
 $role = (string) ($input['role'] ?? 'admin');
 $jobTitle = trim((string) ($input['jobTitle'] ?? ''));

 if ($fullName === '' || $email === '' || $password === '') {
 respond_error('Nome, email e palavra-passe sao obrigatorios.', 422);
 }

 if (!in_array($role, ['operational', 'reception', 'manager', 'admin'], true)) {
 respond_error('Nivel de acesso invalido.', 422);
 }

 if (find_user_by_email($email)) {
 respond_error('Este email ja esta registado.', 409);
 }

 $newUserId = generate_uuid();
 $stmt = db()->prepare(
 'INSERT INTO users (
 id, full_name, email, phone, password_hash, account_type, role, job_title, status
 ) VALUES (
 :id, :full_name, :email, :phone, :password_hash, :account_type, :role, :job_title, :status
 )'
 );
 $stmt->execute([
 'id' => $newUserId,
 'full_name' => $fullName,
 'email' => $email,
 'phone' => $phone !== '' ? $phone : null,
 'password_hash' => password_hash($password, PASSWORD_DEFAULT),
 'account_type' => 'staff',
 'role' => $role,
 'job_title' => $jobTitle !== '' ? $jobTitle : null,
 'status' => 'active',
 ]);

 write_audit_log('team', 'Conta administrativa criada', 'user', $newUserId, $email, [
 'role' => $role,
 'created_by' => $viewer['id'],
 ], $viewer['id']);

 respond_success(user_to_profile_payload(find_user_by_id($newUserId)), 201);
 break;

 case 'admin.staff.update':
 $viewer = require_super_admin();
 $staffId = (string) ($input['id'] ?? '');
 $target = find_user_by_id($staffId);

 if (!$target || ($target['account_type'] ?? 'customer') !== 'staff') {
 respond_error('Funcionario nao encontrado.', 404);
 }

 $role = (string) ($input['role'] ?? $target['role']);
 if (!in_array($role, ['operational', 'reception', 'manager', 'admin', 'super_admin'], true)) {
 respond_error('Nivel de acesso invalido.', 422);
 }

 if ($role === 'super_admin' && $target['role'] !== 'super_admin') {
 respond_error('Nao e permitido criar um segundo super admin.', 403);
 }

 // Proteção do Super Admin principal
 if ($target['email'] === 'geral@carwash46.com') {
 if ($role !== 'super_admin') {
 respond_error('Nao e permitido remover o acesso super_admin do Super Admin principal.', 403);
 }
 if (($input['status'] ?? 'active') !== 'active') {
 respond_error('Nao e permitido desativar ou suspender o Super Admin principal.', 403);
 }
 }

 $stmt = db()->prepare(
 'UPDATE users
 SET full_name = :full_name, role = :role, job_title = :job_title, phone = :phone, status = :status
 WHERE id = :id'
 );
 $stmt->execute([
 'id' => $staffId,
 'full_name' => trim((string) ($input['full_name'] ?? $target['full_name'] ?? '')),
 'role' => $role,
 'job_title' => trim((string) ($input['job_title'] ?? $target['job_title'] ?? '')) ?: null,
 'phone' => trim((string) ($input['phone'] ?? $target['phone'] ?? '')) ?: null,
 'status' => (string) ($input['status'] ?? $target['status'] ?? 'active'),
 ]);

 write_audit_log('team', 'Funcionario atualizado', 'user', $staffId, $target['email'], [
 'updated_by' => $viewer['id'],
 ], $viewer['id']);

 respond_success(user_to_profile_payload(find_user_by_id($staffId)));
 break;

 case 'admin.appointments.list':
 require_staff();
 respond_success(fetch_all_appointments());
 break;

 case 'admin.appointment.status':
 $viewer = require_staff();
 $appointmentId = (string) ($input['id'] ?? '');
 $status = (string) ($input['status'] ?? '');

 if (!in_array($status, ['pending', 'confirmed', 'completed', 'cancelled'], true)) {
 respond_error('Estado de agendamento invalido.', 422);
 }

 $appointmentStmt = db()->prepare('SELECT * FROM appointments WHERE id = :id LIMIT 1');
 $appointmentStmt->execute(['id' => $appointmentId]);
 $appointment = $appointmentStmt->fetch();

 if (!$appointment) {
 respond_error('Agendamento nao encontrado.', 404);
 }

 $updateStmt = db()->prepare('UPDATE appointments SET status = :status WHERE id = :id');
 $updateStmt->execute([
 'id' => $appointmentId,
 'status' => $status,
 ]);

 write_audit_log('queue', 'Estado da fila atualizado', 'appointment', $appointmentId, $appointment['contact_name'], [
 'previous_status' => $appointment['status'],
 'next_status' => $status,
 ], $viewer['id']);

 $updatedStmt = db()->prepare('SELECT * FROM appointments WHERE id = :id LIMIT 1');
 $updatedStmt->execute(['id' => $appointmentId]);
 respond_success(appointment_payload($updatedStmt->fetch()));
 break;

 case 'admin.service_catalog.list':
 require_staff();
 respond_success(fetch_service_catalog(false));
 break;

 case 'admin.service_catalog.save':
 $viewer = require_staff();
 $id = trim((string) ($input['id'] ?? ''));
 $name = trim((string) ($input['name'] ?? ''));
 $code = strtoupper(trim((string) ($input['code'] ?? '')));

 if ($name === '' || $code === '') {
 respond_error('Codigo e nome sao obrigatorios.', 422);
 }

 $recordId = $id !== '' ? $id : generate_uuid();
 $existsStmt = db()->prepare('SELECT id FROM service_catalog WHERE id = :id LIMIT 1');
 $existsStmt->execute(['id' => $recordId]);
 $exists = (bool) $existsStmt->fetchColumn();

 $stmt = db()->prepare(
 'INSERT INTO service_catalog (
 id, code, name, category, description, base_price, promotional_price, is_promotional,
 vat_enabled, vat_included, vat_rate, duration_minutes, is_active, created_by, updated_by
 ) VALUES (
 :id, :code, :name, :category, :description, :base_price, :promotional_price, :is_promotional,
 :vat_enabled, :vat_included, :vat_rate, :duration_minutes, :is_active, :created_by, :updated_by
 )
 ON DUPLICATE KEY UPDATE
 code = VALUES(code),
 name = VALUES(name),
 category = VALUES(category),
 description = VALUES(description),
 base_price = VALUES(base_price),
 promotional_price = VALUES(promotional_price),
 is_promotional = VALUES(is_promotional),
 vat_enabled = VALUES(vat_enabled),
 vat_included = VALUES(vat_included),
 vat_rate = VALUES(vat_rate),
 duration_minutes = VALUES(duration_minutes),
 is_active = VALUES(is_active),
 updated_by = VALUES(updated_by)'
 );
 $stmt->execute([
 'id' => $recordId,
 'code' => $code,
 'name' => $name,
 'category' => trim((string) ($input['category'] ?? 'Lavagem')),
 'description' => trim((string) ($input['description'] ?? '')) ?: null,
 'base_price' => (float) ($input['base_price'] ?? 0),
 'promotional_price' => parse_bool($input['is_promotional'] ?? false)
 ? (float) ($input['promotional_price'] ?? 0)
 : null,
 'is_promotional' => parse_bool($input['is_promotional'] ?? false) ? 1 : 0,
 'vat_enabled' => parse_bool($input['vat_enabled'] ?? true) ? 1 : 0,
 'vat_included' => parse_bool($input['vat_included'] ?? false) ? 1 : 0,
 'vat_rate' => parse_bool($input['vat_enabled'] ?? true) ? (float) ($input['vat_rate'] ?? 16) : 0,
 'duration_minutes' => ($input['duration_minutes'] ?? null) !== null ? (int) $input['duration_minutes'] : null,
 'is_active' => parse_bool($input['is_active'] ?? true) ? 1 : 0,
 'created_by' => $exists ? null : $viewer['id'],
 'updated_by' => $viewer['id'],
 ]);

 write_audit_log('catalog', $exists ? 'Servico atualizado' : 'Servico criado', 'service_catalog', $recordId, $name, [], $viewer['id']);

 $serviceStmt = db()->prepare('SELECT * FROM service_catalog WHERE id = :id LIMIT 1');
 $serviceStmt->execute(['id' => $recordId]);
 $service = $serviceStmt->fetch();
 respond_success(fetch_service_catalog_row($service));
 break;

 case 'admin.service_catalog.delete':
 $viewer = require_staff();
 $serviceId = (string) ($input['id'] ?? '');
 $serviceStmt = db()->prepare('SELECT * FROM service_catalog WHERE id = :id LIMIT 1');
 $serviceStmt->execute(['id' => $serviceId]);
 $service = $serviceStmt->fetch();
 if (!$service) {
 respond_error('Servico nao encontrado.', 404);
 }

 $deleteStmt = db()->prepare('DELETE FROM service_catalog WHERE id = :id');
 $deleteStmt->execute(['id' => $serviceId]);

 write_audit_log('catalog', 'Servico removido', 'service_catalog', $serviceId, $service['name'], [], $viewer['id']);
 respond_success(['deleted' => true]);
 break;

 case 'admin.inventory.list':
 require_staff();
 respond_success(fetch_inventory_snapshot());
 break;

 case 'admin.inventory.save':
 $viewer = require_staff();
 $id = trim((string) ($input['id'] ?? ''));
 $recordId = $id !== '' ? $id : generate_uuid();
 $existsStmt = db()->prepare('SELECT id FROM inventory_items WHERE id = :id LIMIT 1');
 $existsStmt->execute(['id' => $recordId]);
 $exists = (bool) $existsStmt->fetchColumn();

 $stmt = db()->prepare(
 'INSERT INTO inventory_items (
 id, sku, name, category, stock_type, quantity, unit, min_stock,
 unit_cost, unit_price, is_active, created_by, updated_by
 ) VALUES (
 :id, :sku, :name, :category, :stock_type, :quantity, :unit, :min_stock,
 :unit_cost, :unit_price, :is_active, :created_by, :updated_by
 )
 ON DUPLICATE KEY UPDATE
 sku = VALUES(sku),
 name = VALUES(name),
 category = VALUES(category),
 stock_type = VALUES(stock_type),
 quantity = VALUES(quantity),
 unit = VALUES(unit),
 min_stock = VALUES(min_stock),
 unit_cost = VALUES(unit_cost),
 unit_price = VALUES(unit_price),
 is_active = VALUES(is_active),
 updated_by = VALUES(updated_by)'
 );
 $stmt->execute([
 'id' => $recordId,
 'sku' => strtoupper(trim((string) ($input['sku'] ?? ''))),
 'name' => trim((string) ($input['name'] ?? '')),
 'category' => trim((string) ($input['category'] ?? '')),
 'stock_type' => (string) ($input['stock_type'] ?? 'operation'),
 'quantity' => (float) ($input['quantity'] ?? 0),
 'unit' => trim((string) ($input['unit'] ?? 'un')),
 'min_stock' => (float) ($input['min_stock'] ?? 0),
 'unit_cost' => (float) ($input['unit_cost'] ?? 0),
 'unit_price' => (float) ($input['unit_price'] ?? 0),
 'is_active' => parse_bool($input['is_active'] ?? true) ? 1 : 0,
 'created_by' => $exists ? null : $viewer['id'],
 'updated_by' => $viewer['id'],
 ]);

 if (!$exists && (float) ($input['quantity'] ?? 0) > 0) {
 $movementStmt = db()->prepare(
 'INSERT INTO inventory_movements (
 id, inventory_item_id, movement_type, quantity, unit_value, note, performed_by
 ) VALUES (
 :id, :inventory_item_id, :movement_type, :quantity, :unit_value, :note, :performed_by
 )'
 );
 $movementStmt->execute([
 'id' => generate_uuid(),
 'inventory_item_id' => $recordId,
 'movement_type' => 'restock',
 'quantity' => (float) ($input['quantity'] ?? 0),
 'unit_value' => (float) ($input['unit_cost'] ?? 0),
 'note' => 'Carga inicial do item.',
 'performed_by' => $viewer['id'],
 ]);
 }

 write_audit_log('inventory', $exists ? 'Item atualizado' : 'Item criado', 'inventory_item', $recordId, (string) ($input['name'] ?? ''), [], $viewer['id']);
 respond_success(fetch_inventory_snapshot());
 break;

 case 'admin.inventory.delete':
 $viewer = require_staff();
 $itemId = (string) ($input['id'] ?? '');
 $itemStmt = db()->prepare('SELECT * FROM inventory_items WHERE id = :id LIMIT 1');
 $itemStmt->execute(['id' => $itemId]);
 $item = $itemStmt->fetch();
 if (!$item) {
 respond_error('Produto nao encontrado.', 404);
 }

 $deleteStmt = db()->prepare('DELETE FROM inventory_items WHERE id = :id');
 $deleteStmt->execute(['id' => $itemId]);
 write_audit_log('inventory', 'Item removido', 'inventory_item', $itemId, $item['name'], [], $viewer['id']);
 respond_success(['deleted' => true]);
 break;

 case 'admin.inventory.adjust':
 $viewer = require_staff();
 $itemId = (string) ($input['id'] ?? '');
 $delta = (float) ($input['delta'] ?? 0);
 $itemStmt = db()->prepare('SELECT * FROM inventory_items WHERE id = :id LIMIT 1');
 $itemStmt->execute(['id' => $itemId]);
 $item = $itemStmt->fetch();
 if (!$item) {
 respond_error('Produto nao encontrado.', 404);
 }

 $nextQuantity = max(0, (float) $item['quantity'] + $delta);
 $updateStmt = db()->prepare(
 'UPDATE inventory_items SET quantity = :quantity, updated_by = :updated_by WHERE id = :id'
 );
 $updateStmt->execute([
 'quantity' => $nextQuantity,
 'updated_by' => $viewer['id'],
 'id' => $itemId,
 ]);

 $movementStmt = db()->prepare(
 'INSERT INTO inventory_movements (
 id, inventory_item_id, movement_type, quantity, unit_value, note, performed_by
 ) VALUES (
 :id, :inventory_item_id, :movement_type, :quantity, :unit_value, :note, :performed_by
 )'
 );
 $movementStmt->execute([
 'id' => generate_uuid(),
 'inventory_item_id' => $itemId,
 'movement_type' => $delta >= 0 ? 'restock' : 'usage',
 'quantity' => abs($delta),
 'unit_value' => (float) $item['unit_cost'],
 'note' => 'Ajuste rapido no painel.',
 'performed_by' => $viewer['id'],
 ]);

 write_audit_log('inventory', 'Quantidade ajustada', 'inventory_item', $itemId, $item['name'], [
 'delta' => $delta,
 'next_quantity' => $nextQuantity,
 ], $viewer['id']);

 respond_success(fetch_inventory_snapshot());
 break;

 case 'admin.documents.list':
 require_staff();
 respond_success(fetch_documents_with_items());
 break;

  case 'admin.documents.create':
		$paymentMethod = ($input['payment_method'] ?? null) ?: null;
		if ($paymentMethod !== null) {
			$allowedMethods = ['cash', 'mpesa', 'emola', 'mkesh', 'card', 'bank-transfer', 'qr', 'mobile_money'];
			if (!in_array($paymentMethod, $allowedMethods, true)) {
				respond_error('Metodo de pagamento invalido: ' . $paymentMethod, 422);
			}
		}
 $viewer = require_staff();
 $items = is_array($input['items'] ?? null) ? $input['items'] : [];
 if (count($items) === 0) {
 respond_error('Adicione pelo menos um item ao documento.', 422);
 }

 $documentId = generate_uuid();
 $appointmentId = trim((string) ($input['appointmentId'] ?? $input['appointment_id'] ?? ''));

 // Verificar se há appointment_id nos itens
 if ($appointmentId === '') {
 foreach ($items as $item) {
 $itemIdApp = trim((string) ($item['appointmentId'] ?? $item['appointment_id'] ?? ''));
 if ($itemIdApp !== '') {
 $appointmentId = $itemIdApp;
 break;
 }
 }
 }

 $pdo = db();
 $pdo->beginTransaction();

 try {
 $docStmt = $pdo->prepare(
 'INSERT INTO business_documents (
 id, number, kind, report_category, status, source, title, issue_date, due_date,
 customer_id, party_name, party_tax_id, party_email, party_phone, party_address,
 payment_method, vat_enabled, vat_included, vat_rate, subtotal, vat_amount, total,
 notes, body, issued_by
 ) VALUES (
 :id, :number, :kind, :report_category, :status, :source, :title, :issue_date, :due_date,
 :customer_id, :party_name, :party_tax_id, :party_email, :party_phone, :party_address,
 :payment_method, :vat_enabled, :vat_included, :vat_rate, :subtotal, :vat_amount, :total,
 :notes, :body, :issued_by
 )'
 );
 $docStmt->execute([
 'id' => $documentId,
 'number' => (string) ($input['number'] ?? ''),
 'kind' => (string) ($input['kind'] ?? 'invoice'),
 'report_category' => (string) ($input['report_category'] ?? 'with_vat'),
 'status' => (string) ($input['status'] ?? 'Issued'),
 'source' => (string) ($input['source'] ?? 'manual'),
 'title' => (string) ($input['title'] ?? 'Documento'),
 'issue_date' => (string) ($input['issue_date'] ?? date('Y-m-d')),
 'due_date' => ($input['due_date'] ?? null) ?: null,
 'customer_id' => ($input['customer_id'] ?? null) ?: null,
 'party_name' => (string) ($input['party_name'] ?? 'Cliente'),
 'party_tax_id' => ($input['party_tax_id'] ?? null) ?: null,
 'party_email' => ($input['party_email'] ?? null) ?: null,
 'party_phone' => ($input['party_phone'] ?? null) ?: null,
 'party_address' => ($input['party_address'] ?? null) ?: null,
 'payment_method' => ($input['payment_method'] ?? null) ?: null,
 'vat_enabled' => parse_bool($input['vat_enabled'] ?? true) ? 1 : 0,
 'vat_included' => parse_bool($input['vat_included'] ?? false) ? 1 : 0,
 'vat_rate' => (float) ($input['vat_rate'] ?? 16),
 'subtotal' => (float) ($input['subtotal'] ?? 0),
 'vat_amount' => (float) ($input['vat_amount'] ?? 0),
 'total' => (float) ($input['total'] ?? 0),
 'notes' => ($input['notes'] ?? null) ?: null,
 'body' => ($input['body'] ?? null) ?: null,
 'issued_by' => $viewer['id'],
 ]);

 $itemStmt = $pdo->prepare(
 'INSERT INTO business_document_items (
 id, document_id, service_id, description, details, quantity, unit_price, line_total
 ) VALUES (
 :id, :document_id, :service_id, :description, :details, :quantity, :unit_price, :line_total
 )'
 );

 foreach ($items as $item) {
 $qty = (float) ($item['quantity'] ?? 1);
 $unitPrice = (float) ($item['unit_price'] ?? $item['unitPrice'] ?? 0);
 $itemStmt->execute([
 'id' => generate_uuid(),
 'document_id' => $documentId,
 'service_id' => ($item['service_id'] ?? $item['serviceId'] ?? null) ?: null,
 'description' => (string) ($item['description'] ?? ''),
 'details' => ($item['details'] ?? null) ?: null,
 'quantity' => $qty,
 'unit_price' => $unitPrice,
 'line_total' => $qty * $unitPrice,
 ]);
 }

 // 1. Atualizar agendamento / fila automaticamente se houver vínculo
 if ($appointmentId !== '') {
 $apptStmt = $pdo->prepare(
 'UPDATE appointments
 SET status = :status,
 completed_at = CURRENT_TIMESTAMP,
 completed_by = :completed_by,
 invoice_id = :invoice_id,
 payment_status = :payment_status
 WHERE id = :id'
 );
 $apptStmt->execute([
 'status' => 'completed',
 'completed_by' => $viewer['id'],
 'invoice_id' => $documentId,
 'payment_status' => 'paid',
 'id' => $appointmentId
 ]);

 write_audit_log('queue', 'Agendamento faturado e concluido', 'appointment', $appointmentId, 'Status completado automaticamente', [
 'invoice_id' => $documentId,
 'completed_by' => $viewer['id']
 ], $viewer['id']);
 }

 // 2. ARQUITETURA PARA FUTURA AUTOMATIZACAO DE STOCK
 /*
 foreach ($items as $item) {
 if (!empty($item['service_id'])) {
 }
 }
 */

 $pdo->commit();
 } catch (Throwable $exception) {
 $pdo->rollBack();
 throw $exception;
 }

 write_audit_log('documents', 'Documento criado', 'business_document', $documentId, (string) ($input['number'] ?? $documentId), [
 'kind' => $input['kind'] ?? 'invoice',
 'source' => $input['source'] ?? 'manual',
 ], $viewer['id']);

 $documents = fetch_documents_with_items();
 $created = null;
 foreach ($documents as $document) {
 if (($document['id'] ?? '') === $documentId) {
 $created = $document;
 break;
 }
 }
 respond_success($created, 201);
 break;

 case 'admin.audit_logs.list':
 require_staff();
 respond_success(fetch_audit_logs());
 break;

 case 'admin.settings.get':
 require_staff();
 respond_success([
 'company' => fetch_company_settings(),
 'audit_logs' => fetch_audit_logs(),
 ]);
 break;

 case 'admin.settings.save':
 $viewer = require_staff();
 $company = is_array($input['company'] ?? null) ? $input['company'] : [];
 $settings = array_merge(default_company_settings(), [
 'legalName' => trim((string) ($company['legalName'] ?? '')),
 'brandName' => trim((string) ($company['brandName'] ?? '')),
 'tagline' => trim((string) ($company['tagline'] ?? '')),
 'nuit' => trim((string) ($company['nuit'] ?? '')),
 'phone' => trim((string) ($company['phone'] ?? '')),
 'email' => trim((string) ($company['email'] ?? '')),
 'website' => trim((string) ($company['website'] ?? '')),
 'addressLine1' => trim((string) ($company['addressLine1'] ?? '')),
 'addressLine2' => trim((string) ($company['addressLine2'] ?? '')),
 'country' => trim((string) ($company['country'] ?? '')),
 'bankDetails' => trim((string) ($company['bankDetails'] ?? '')),
 'accentColor' => trim((string) ($company['accentColor'] ?? '#0047FF')),
 'logoDataUrl' => ($company['logoDataUrl'] ?? null) ?: null,
 'defaultVatRate' => (float) ($company['defaultVatRate'] ?? 16),
 'defaultVatIncluded' => parse_bool($company['defaultVatIncluded'] ?? false),
 ]);

 if ($settings['legalName'] === '' || $settings['brandName'] === '') {
 respond_error('Nome legal e marca da empresa sao obrigatorios.', 422);
 }

 if ($settings['logoDataUrl'] !== null && strlen((string) $settings['logoDataUrl']) > 900000) {
 respond_error('O logotipo e demasiado grande. Use uma imagem PNG/JPG menor.', 422);
 }

 $stmt = db()->prepare(
 'INSERT INTO app_settings (setting_key, setting_value, updated_by)
 VALUES (:setting_key, :setting_value, :updated_by)
 ON DUPLICATE KEY UPDATE
 setting_value = VALUES(setting_value),
 updated_by = VALUES(updated_by)'
 );
 $stmt->execute([
 'setting_key' => 'company_profile',
 'setting_value' => json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
 'updated_by' => $viewer['id'],
 ]);

 write_audit_log('settings', 'Definicoes da empresa atualizadas', 'app_settings', 'company_profile', $settings['brandName'], [], $viewer['id']);
 respond_success(fetch_company_settings());
 break;

 case 'ai.openrouter.chat':
 $user = require_auth();
 $messages = is_array($input['messages'] ?? null) ? $input['messages'] : [];
 $model = trim((string) ($input['model'] ?? 'openai/gpt-4.1-mini'));

 if (count($messages) === 0) {
 respond_error('Envie pelo menos uma mensagem para o chat do OpenRouter.', 422);
 }

 $result = openrouter_chat($messages, $model);
 respond_success($result);
 break;

 default:
 respond_error('Endpoint nao encontrado.', 404);
 }
} catch (PDOException $exception) {
 $errorMsg = 'PDOException: ' . $exception->getMessage() . "\n" . $exception->getTraceAsString();
 error_log($errorMsg);
 try {
 write_audit_log('system_error', 'Erro de base de dados', 'system', null, null, [
 'message' => $exception->getMessage(),
 'action' => $action,
 ], $_SESSION['user_id'] ?? null);
 } catch (Throwable $e) {}
 respond_error('Falha de base de dados interna.', 500);
} catch (Throwable $exception) {
 $errorMsg = 'Exception: ' . $exception->getMessage() . "\n" . $exception->getTraceAsString();
 error_log($errorMsg);
 try {
 write_audit_log('system_error', 'Erro interno de servidor', 'system', null, null, [
 'message' => $exception->getMessage(),
 'action' => $action,
 ], $_SESSION['user_id'] ?? null);
 } catch (Throwable $e) {}
 respond_error($exception->getMessage() !== '' ? $exception->getMessage() : 'Erro interno de servidor.', 500);
}

function fetch_service_catalog_row(array $row): array
{
 return [
 'id' => $row['id'],
 'code' => $row['code'],
 'name' => $row['name'],
 'category' => $row['category'],
 'description' => $row['description'],
 'base_price' => (float) $row['base_price'],
 'promotional_price' => $row['promotional_price'] !== null ? (float) $row['promotional_price'] : null,
 'is_promotional' => (bool) $row['is_promotional'],
 'vat_enabled' => (bool) $row['vat_enabled'],
 'vat_included' => (bool) $row['vat_included'],
 'vat_rate' => (float) $row['vat_rate'],
 'duration_minutes' => $row['duration_minutes'] !== null ? (int) $row['duration_minutes'] : null,
 'is_active' => (bool) $row['is_active'],
 'created_by' => $row['created_by'],
 'updated_by' => $row['updated_by'],
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 'updated_at' => date(DATE_ATOM, strtotime((string) $row['updated_at'])),
 ];
}
