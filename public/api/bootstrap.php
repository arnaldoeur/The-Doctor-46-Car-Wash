<?php

declare(strict_types=1);

function app_config(): array
{
 static $config = null;

 if ($config !== null) {
 return $config;
 }

 $config = require __DIR__ . '/config.php';
 $localConfigFile = __DIR__ . '/config.local.php';

 if (is_file($localConfigFile)) {
 $local = require $localConfigFile;
 if (is_array($local)) {
 $config = array_replace_recursive($config, $local);
 }
 }

 return $config;
}

function openrouter_config(): array
{
 $config = app_config()['openrouter'] ?? [];
 return array_merge([
 'api_key' => '',
 'endpoint' => 'https://api.openrouter.ai/v1/chat/completions',
 ], $config);
}

function openrouter_api_key(): string
{
 return (string) (openrouter_config()['api_key'] ?? '');
}

function openrouter_endpoint(): string
{
 return (string) (openrouter_config()['endpoint'] ?? 'https://api.openrouter.ai/v1/chat/completions');
}

function openrouter_chat(array $messages, string $model = 'openai/gpt-4.1-mini'): array
{
 $apiKey = openrouter_api_key();
 if ($apiKey === '') {
 respond_error('OpenRouter API key nao esta configurada.', 500);
 }

 $formattedMessages = array_values(array_map(static function ($message) {
 return [
 'role' => isset($message['role']) ? (string) $message['role'] : 'user',
 'content' => isset($message['content']) ? (string) $message['content'] : '',
 ];
 }, $messages));

 if (count($formattedMessages) === 0) {
 respond_error('Envie pelo menos uma mensagem para o OpenRouter.', 422);
 }

 $payload = [
 'model' => $model,
 'messages' => $formattedMessages,
 ];

 $ch = curl_init(openrouter_endpoint());
 if ($ch === false) {
 respond_error('Nao foi possivel inicializar a requisicao HTTP.', 500);
 }

 curl_setopt_array($ch, [
 CURLOPT_RETURNTRANSFER => true,
 CURLOPT_POST => true,
 CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
 CURLOPT_HTTPHEADER => [
 'Content-Type: application/json',
 'Authorization: Bearer ' . $apiKey,
 ],
 CURLOPT_TIMEOUT => 30,
 ]);

 $response = curl_exec($ch);
 $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
 $curlError = curl_error($ch);
 curl_close($ch);

 if ($response === false) {
 respond_error('Falha na requisicao OpenRouter: ' . $curlError, 502);
 }

 $decoded = json_decode($response, true);
 if (!is_array($decoded)) {
 respond_error('Resposta invalida do OpenRouter.', 502);
 }

 if ($httpCode < 200 || $httpCode >= 300) {
 $errorMessage = $decoded['error']['message'] ?? json_encode($decoded);
 respond_error('OpenRouter retornou erro: ' . $errorMessage, 502);
 }

 return $decoded;
}

function start_app_session(): void
{
 if (session_status() === PHP_SESSION_ACTIVE) {
 return;
 }

 $config = app_config();
 session_name((string) ($config['auth']['session_name'] ?? 'doctor46_session'));
 session_set_cookie_params([
 'lifetime' => 0,
 'path' => '/',
 'httponly' => true,
 'samesite' => 'Lax',
 'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
 ]);
 session_start();
}

function db(bool $ensureSuperAdmin = true): PDO
{
 static $pdo = null;

 if ($pdo instanceof PDO) {
 if ($ensureSuperAdmin) {
 ensure_default_super_admin($pdo);
 }
 return $pdo;
 }

 $dbConfig = app_config()['db'];
 $dsn = sprintf(
 'mysql:host=%s;port=%d;dbname=%s;charset=%s',
 $dbConfig['host'],
 $dbConfig['port'],
 $dbConfig['name'],
 $dbConfig['charset']
 );

 $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['password'], [
		PDO::ATTR_TIMEOUT => 4,
 PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
 PDO::ATTR_EMULATE_PREPARES => false,
 ]);

 if ($ensureSuperAdmin) {
 ensure_default_super_admin($pdo);
 }

 return $pdo;
}

function ensure_default_super_admin(PDO $pdo): void
{
 $count = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'super_admin'")->fetchColumn();
 if ($count > 0) {
 return;
 }

 $config = app_config();
 $superAdmin = $config['auth']['super_admin'] ?? [];
 $password = (string) ($superAdmin['password'] ?? '');

 if ($password === '') {
 return;
 }

 $stmt = $pdo->prepare(
 'INSERT INTO users (
 id, full_name, email, phone, password_hash, account_type, role, job_title, status
 ) VALUES (
 :id, :full_name, :email, :phone, :password_hash, :account_type, :role, :job_title, :status
 )'
 );

 $stmt->execute([
 'id' => generate_uuid(),
 'full_name' => (string) ($superAdmin['full_name'] ?? 'Super Admin'),
 'email' => normalize_email((string) ($superAdmin['email'] ?? 'geral@carwash46.com')),
 'phone' => (string) ($superAdmin['phone'] ?? ''),
 'password_hash' => password_hash($password, PASSWORD_DEFAULT),
 'account_type' => 'staff',
 'role' => 'super_admin',
 'job_title' => 'Super Admin',
 'status' => 'active',
 ]);
}

function json_input(): array
{
 $raw = file_get_contents('php://input');
 if (!$raw) {
 return [];
 }

 $decoded = json_decode($raw, true);
 return is_array($decoded) ? $decoded : [];
}

function respond(array $payload, int $status = 200): void
{
 http_response_code($status);
 header('Content-Type: application/json; charset=utf-8');
 echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
 exit;
}

function respond_success($data = null, int $status = 200): void
{
 respond([
 'success' => true,
 'data' => $data,
 ], $status);
}

function respond_error(string $message, int $status = 400, array $extra = []): void
{
 respond(array_merge([
 'success' => false,
 'message' => $message,
 ], $extra), $status);
}

function generate_uuid(): string
{
 $data = random_bytes(16);
 $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
 $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
 return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function normalize_email(string $email): string
{
 return mb_strtolower(trim($email));
}

function parse_bool($value): bool
{
 return filter_var($value, FILTER_VALIDATE_BOOLEAN);
}

function format_money_text(float $amount): string
{
 $formatted = number_format($amount, 2, '.', ' ');
 return rtrim(rtrim($formatted, '0'), '.') . ' MT';
}

function duration_to_text($minutes): ?string
{
 if ($minutes === null) {
 return null;
 }

 $intMinutes = (int) $minutes;
 if ($intMinutes <= 0) {
 return null;
 }

 return $intMinutes . ' min';
}

function parse_money_text(string $value): float
{
 $normalized = preg_replace('/[^0-9,.\-]/', '', $value) ?? '';
 $normalized = str_replace(' ', '', $normalized);

 if (substr_count($normalized, ',') > 0 && substr_count($normalized, '.') > 0) {
 $normalized = str_replace('.', '', $normalized);
 $normalized = str_replace(',', '.', $normalized);
 } elseif (substr_count($normalized, ',') > 0) {
 $normalized = str_replace(',', '.', $normalized);
 }

 $parsed = (float) $normalized;
 return is_finite($parsed) ? $parsed : 0.0;
}

function calculate_loyalty_points_from_price(string $priceText): int
{
 $amount = parse_money_text($priceText);
 if ($amount <= 0) {
 return 10;
 }

 return max(10, (int) round($amount / 100));
}

function current_user_row(): ?array
{
 start_app_session();

 $userId = $_SESSION['user_id'] ?? null;
 if (!is_string($userId) || trim($userId) === '') {
 return null;
 }

 return find_user_by_id($userId);
}

function find_user_by_id(string $userId): ?array
{
 $stmt = db()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
 $stmt->execute(['id' => $userId]);
 $row = $stmt->fetch();

 return is_array($row) ? $row : null;
}

function find_user_by_email(string $email): ?array
{
 $stmt = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
 $stmt->execute(['email' => normalize_email($email)]);
 $row = $stmt->fetch();

 return is_array($row) ? $row : null;
}

function user_to_auth_payload(array $user): array
{
 return [
 'id' => $user['id'],
 'email' => $user['email'],
 'user_metadata' => [
 'full_name' => $user['full_name'],
 'phone' => $user['phone'],
 ],
 ];
}

function user_to_profile_payload(array $user): array
{
 return [
 'id' => $user['id'],
 'full_name' => $user['full_name'],
 'email' => $user['email'],
 'phone' => $user['phone'],
 'account_type' => $user['account_type'],
 'role' => $user['role'],
 'job_title' => $user['job_title'],
 'status' => $user['status'],
 'avatar_url' => $user['avatar_url'],
 'preferred_language' => $user['preferred_language'] ?? 'pt',
 'last_login_at' => $user['last_login_at'],
 'created_at' => date(DATE_ATOM, strtotime((string) $user['created_at'])),
 'updated_at' => date(DATE_ATOM, strtotime((string) $user['updated_at'])),
 ];
}

function require_auth(): array
{
 $user = current_user_row();
 if (!$user) {
 respond_error('Sessao expirada. Entre novamente.', 401);
 }

 $status = $user['status'] ?? 'active';
 if (in_array($status, ['inactive', 'vacation', 'suspended'], true)) {
 // Invalidação imediata de sessão local
 $_SESSION = [];
 if (ini_get('session.use_cookies')) {
 $params = session_get_cookie_params();
 setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
 }
 @session_destroy();
 respond_error('Esta conta foi desativada ou encontra-se de ferias.', 403);
 }

 return $user;
}

function is_staff_role(array $user): bool
{
 return ($user['account_type'] ?? 'customer') === 'staff'
 || in_array($user['role'] ?? '', ['operational', 'reception', 'manager', 'admin', 'super_admin'], true);
}

function require_staff(): array
{
 $user = require_auth();

 if (!is_staff_role($user)) {
 respond_error('Acesso restrito a staff.', 403);
 }

 return $user;
}

function require_super_admin(): array
{
 $user = require_staff();

 if (($user['role'] ?? '') !== 'super_admin') {
 respond_error('Apenas o super admin pode executar esta acao.', 403);
 }

 return $user;
}

function write_audit_log(
 string $module,
 string $action,
 string $entityType,
 ?string $entityId,
 ?string $entityLabel,
 array $metadata,
 ?string $performedBy
): void {
 $stmt = db()->prepare(
 'INSERT INTO audit_logs (
 id, module, action, entity_type, entity_id, entity_label, metadata, performed_by
 ) VALUES (
 :id, :module, :action, :entity_type, :entity_id, :entity_label, :metadata, :performed_by
 )'
 );

 $stmt->execute([
 'id' => generate_uuid(),
 'module' => $module,
 'action' => $action,
 'entity_type' => $entityType,
 'entity_id' => $entityId,
 'entity_label' => $entityLabel,
 'metadata' => json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
 'performed_by' => $performedBy,
 ]);
}

function fetch_all_profiles(): array
{
 $rows = db()->query('SELECT * FROM users ORDER BY full_name ASC, email ASC')->fetchAll();
 return array_map('user_to_profile_payload', $rows ?: []);
}

function fetch_service_catalog(bool $onlyActive = false): array
{
 $sql = 'SELECT * FROM service_catalog';
 if ($onlyActive) {
 $sql .= ' WHERE is_active = 1';
 }
 $sql .= ' ORDER BY is_active DESC, name ASC';

 $rows = db()->query($sql)->fetchAll() ?: [];
 return array_map(static function (array $row): array {
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
 }, $rows);
}

function fetch_appointments_for_customer(string $customerId): array
{
 $stmt = db()->prepare(
 'SELECT * FROM appointments
 WHERE customer_id = :customer_id
 ORDER BY appointment_date ASC, appointment_time ASC'
 );
 $stmt->execute(['customer_id' => $customerId]);
 $rows = $stmt->fetchAll() ?: [];

 return array_map('appointment_payload', $rows);
}

function fetch_all_appointments(): array
{
 $rows = db()->query(
 'SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC, created_at DESC'
 )->fetchAll() ?: [];

 return array_map('appointment_payload', $rows);
}

function appointment_payload(array $row): array
{
 return [
 'id' => $row['id'],
 'customer_id' => $row['customer_id'],
 'service_id' => $row['service_id'],
 'service_name' => $row['service_name'],
 'service_price_text' => $row['service_price_text'],
 'service_duration_text' => $row['service_duration_text'],
 'appointment_date' => $row['appointment_date'],
 'appointment_time' => $row['appointment_time'],
 'status' => $row['status'],
 'vehicle_make' => $row['vehicle_make'],
 'vehicle_model' => $row['vehicle_model'],
 'vehicle_plate' => $row['vehicle_plate'],
 'contact_name' => $row['contact_name'],
 'contact_email' => $row['contact_email'],
 'contact_phone' => $row['contact_phone'],
 'loyalty_points_earned' => (int) $row['loyalty_points_earned'],
 'completed_at' => !empty($row['completed_at']) ? date(DATE_ATOM, strtotime((string) $row['completed_at'])) : null,
 'completed_by' => $row['completed_by'] ?? null,
 'invoice_id' => $row['invoice_id'] ?? null,
 'payment_status' => $row['payment_status'] ?? null,
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 'updated_at' => date(DATE_ATOM, strtotime((string) $row['updated_at'])),
 ];
}

function fetch_inventory_snapshot(): array
{
 $items = db()->query('SELECT * FROM inventory_items ORDER BY name ASC')->fetchAll() ?: [];
 $movements = db()->query('SELECT * FROM inventory_movements ORDER BY created_at DESC')->fetchAll() ?: [];

 return [
 'items' => array_map(static function (array $row): array {
 return [
 'id' => $row['id'],
 'sku' => $row['sku'],
 'name' => $row['name'],
 'category' => $row['category'],
 'stock_type' => $row['stock_type'],
 'quantity' => (float) $row['quantity'],
 'unit' => $row['unit'],
 'min_stock' => (float) $row['min_stock'],
 'unit_cost' => (float) $row['unit_cost'],
 'unit_price' => (float) $row['unit_price'],
 'is_active' => (bool) $row['is_active'],
 'created_by' => $row['created_by'],
 'updated_by' => $row['updated_by'],
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 'updated_at' => date(DATE_ATOM, strtotime((string) $row['updated_at'])),
 ];
 }, $items),
 'movements' => array_map(static function (array $row): array {
 return [
 'id' => $row['id'],
 'inventory_item_id' => $row['inventory_item_id'],
 'movement_type' => $row['movement_type'],
 'quantity' => (float) $row['quantity'],
 'unit_value' => (float) $row['unit_value'],
 'note' => $row['note'],
 'reference_type' => $row['reference_type'],
 'reference_id' => $row['reference_id'],
 'performed_by' => $row['performed_by'],
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 ];
 }, $movements),
 ];
}

function fetch_documents_with_items(): array
{
 $documents = db()->query(
 'SELECT * FROM business_documents ORDER BY issue_date DESC, created_at DESC'
 )->fetchAll() ?: [];
 $items = db()->query(
 'SELECT * FROM business_document_items ORDER BY created_at ASC'
 )->fetchAll() ?: [];

 $itemsByDocument = [];
 foreach ($items as $item) {
 $documentId = (string) $item['document_id'];
 if (!array_key_exists($documentId, $itemsByDocument)) {
 $itemsByDocument[$documentId] = [];
 }

 $itemsByDocument[$documentId][] = [
 'id' => $item['id'],
 'document_id' => $item['document_id'],
 'service_id' => $item['service_id'],
 'description' => $item['description'],
 'details' => $item['details'],
 'quantity' => (float) $item['quantity'],
 'unit_price' => (float) $item['unit_price'],
 'line_total' => (float) $item['line_total'],
 'created_at' => date(DATE_ATOM, strtotime((string) $item['created_at'])),
 ];
 }

 return array_map(static function (array $row) use ($itemsByDocument): array {
 $documentId = (string) $row['id'];

 return [
 'id' => $row['id'],
 'number' => $row['number'],
 'kind' => $row['kind'],
 'report_category' => $row['report_category'],
 'status' => $row['status'],
 'source' => $row['source'],
 'title' => $row['title'],
 'issue_date' => $row['issue_date'],
 'due_date' => $row['due_date'],
 'customer_id' => $row['customer_id'],
 'party_name' => $row['party_name'],
 'party_tax_id' => $row['party_tax_id'],
 'party_email' => $row['party_email'],
 'party_phone' => $row['party_phone'],
 'party_address' => $row['party_address'],
 'payment_method' => $row['payment_method'],
 'vat_enabled' => (bool) $row['vat_enabled'],
 'vat_included' => (bool) $row['vat_included'],
 'vat_rate' => (float) $row['vat_rate'],
 'subtotal' => (float) $row['subtotal'],
 'vat_amount' => (float) $row['vat_amount'],
 'total' => (float) $row['total'],
 'notes' => $row['notes'],
 'body' => $row['body'],
 'issued_by' => $row['issued_by'],
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 'updated_at' => date(DATE_ATOM, strtotime((string) $row['updated_at'])),
 'business_document_items' => $itemsByDocument[$documentId] ?? [],
 ];
 }, $documents);
}

function fetch_audit_logs(): array
{
 $rows = db()->query(
 'SELECT audit_logs.*, users.full_name AS user_name
 FROM audit_logs
 LEFT JOIN users ON users.id = audit_logs.performed_by
 ORDER BY audit_logs.created_at DESC
 LIMIT 300'
 )->fetchAll() ?: [];

 return array_map(static function (array $row): array {
 return [
 'id' => $row['id'],
 'module' => $row['module'],
 'action' => $row['action'],
 'entity_type' => $row['entity_type'],
 'entity_id' => $row['entity_id'],
 'entity_label' => $row['entity_label'],
 'metadata' => $row['metadata'] ? json_decode((string) $row['metadata'], true) : [],
 'performed_by' => $row['performed_by'],
 'created_at' => date(DATE_ATOM, strtotime((string) $row['created_at'])),
 'user_name' => $row['user_name'],
 ];
 }, $rows);
}

function default_company_settings(): array
{
 return [
 'legalName' => 'The Doctor 46 Car Wash, Lda.',
 'brandName' => 'THE DOCTOR 46',
 'tagline' => 'Car Wash',
 'nuit' => '400123456',
 'phone' => '+258 87 412 4865',
 'email' => 'geral@carwash46.com',
 'website' => 'https://carwash46.com',
 'addressLine1' => 'Bairro Medeiros',
 'addressLine2' => 'Lichinga, Niassa',
 'country' => 'Mozambique',
 'bankDetails' => 'BCI | MZN | Conta Empresarial 0046 0001 2026',
 'accentColor' => '#0047FF',
 'logoDataUrl' => null,
 'defaultVatRate' => 16,
 'defaultVatIncluded' => false,
 ];
}

function fetch_company_settings(): array
{
 $defaults = default_company_settings();
 $stmt = db()->prepare('SELECT setting_value FROM app_settings WHERE setting_key = :setting_key LIMIT 1');
 $stmt->execute(['setting_key' => 'company_profile']);
 $raw = $stmt->fetchColumn();

 if (!is_string($raw) || $raw === '') {
 return $defaults;
 }

 $decoded = json_decode($raw, true);
 if (!is_array($decoded)) {
 return $defaults;
 }

 return array_merge($defaults, $decoded);
}
