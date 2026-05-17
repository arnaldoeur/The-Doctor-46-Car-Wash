CREATE TABLE IF NOT EXISTS users (
 id CHAR(36) NOT NULL PRIMARY KEY,
 full_name VARCHAR(160) NULL,
 email VARCHAR(190) NOT NULL,
 phone VARCHAR(50) NULL,
 password_hash VARCHAR(255) NOT NULL,
 account_type ENUM('customer', 'staff') NOT NULL DEFAULT 'customer',
 role ENUM('customer', 'operational', 'reception', 'manager', 'admin', 'super_admin') NOT NULL DEFAULT 'customer',
 job_title VARCHAR(120) NULL,
 status ENUM('active', 'inactive', 'vacation') NOT NULL DEFAULT 'active',
 avatar_url VARCHAR(255) NULL,
 preferred_language VARCHAR(5) NOT NULL DEFAULT 'pt',
 last_login_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 super_admin_guard TINYINT GENERATED ALWAYS AS (CASE WHEN role = 'super_admin' THEN 1 ELSE NULL END) STORED,
 UNIQUE KEY uq_users_email (email),
 UNIQUE KEY uq_users_super_admin_guard (super_admin_guard)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_catalog (
 id VARCHAR(40) NOT NULL PRIMARY KEY,
 code VARCHAR(50) NOT NULL,
 name VARCHAR(190) NOT NULL,
 category VARCHAR(120) NOT NULL,
 description TEXT NULL,
 base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
 promotional_price DECIMAL(12,2) NULL,
 is_promotional TINYINT(1) NOT NULL DEFAULT 0,
 vat_enabled TINYINT(1) NOT NULL DEFAULT 1,
 vat_included TINYINT(1) NOT NULL DEFAULT 0,
 vat_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00,
 duration_minutes INT NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_by CHAR(36) NULL,
 updated_by CHAR(36) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_service_catalog_code (code),
 CONSTRAINT fk_service_catalog_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
 CONSTRAINT fk_service_catalog_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
 id CHAR(36) NOT NULL PRIMARY KEY,
 customer_id CHAR(36) NOT NULL,
 service_id VARCHAR(40) NULL,
 service_name VARCHAR(190) NOT NULL,
 service_price_text VARCHAR(60) NOT NULL,
 service_duration_text VARCHAR(60) NULL,
 appointment_date DATE NOT NULL,
 appointment_time VARCHAR(10) NOT NULL,
 status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'confirmed',
 vehicle_make VARCHAR(100) NOT NULL,
 vehicle_model VARCHAR(100) NOT NULL,
 vehicle_plate VARCHAR(60) NOT NULL,
 contact_name VARCHAR(160) NOT NULL,
 contact_email VARCHAR(190) NULL,
 contact_phone VARCHAR(60) NOT NULL,
 loyalty_points_earned INT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_appointments_customer (customer_id),
 KEY idx_appointments_date_time (appointment_date, appointment_time),
 CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
 CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES service_catalog (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
 id CHAR(36) NOT NULL PRIMARY KEY,
 sku VARCHAR(60) NOT NULL,
 name VARCHAR(190) NOT NULL,
 category VARCHAR(120) NOT NULL,
 stock_type ENUM('sale', 'operation') NOT NULL DEFAULT 'operation',
 quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
 unit VARCHAR(30) NOT NULL DEFAULT 'un',
 min_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
 unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
 unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_by CHAR(36) NULL,
 updated_by CHAR(36) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_inventory_items_sku (sku),
 CONSTRAINT fk_inventory_items_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
 CONSTRAINT fk_inventory_items_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
 id CHAR(36) NOT NULL PRIMARY KEY,
 inventory_item_id CHAR(36) NOT NULL,
 movement_type ENUM('sale', 'usage', 'restock', 'adjustment', 'loss') NOT NULL,
 quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
 unit_value DECIMAL(12,2) NOT NULL DEFAULT 0,
 note TEXT NULL,
 reference_type VARCHAR(60) NULL,
 reference_id VARCHAR(80) NULL,
 performed_by CHAR(36) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_inventory_movements_item_created (inventory_item_id, created_at),
 CONSTRAINT fk_inventory_movements_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id) ON DELETE CASCADE,
 CONSTRAINT fk_inventory_movements_user FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_documents (
 id CHAR(36) NOT NULL PRIMARY KEY,
 number VARCHAR(80) NOT NULL,
 kind ENUM('invoice', 'receipt', 'purchase-order', 'quotation', 'letterhead') NOT NULL,
 report_category ENUM('with_vat', 'without_vat') NOT NULL DEFAULT 'with_vat',
 status VARCHAR(40) NOT NULL,
 source ENUM('manual', 'pos', 'billing', 'system') NOT NULL DEFAULT 'manual',
 title VARCHAR(190) NOT NULL,
 issue_date DATE NOT NULL,
 due_date DATE NULL,
 customer_id CHAR(36) NULL,
 party_name VARCHAR(190) NOT NULL,
 party_tax_id VARCHAR(80) NULL,
 party_email VARCHAR(190) NULL,
 party_phone VARCHAR(60) NULL,
 party_address VARCHAR(255) NULL,
 payment_method VARCHAR(40) NULL,
 vat_enabled TINYINT(1) NOT NULL DEFAULT 1,
 vat_included TINYINT(1) NOT NULL DEFAULT 0,
 vat_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00,
 subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
 vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 total DECIMAL(12,2) NOT NULL DEFAULT 0,
 notes TEXT NULL,
 body MEDIUMTEXT NULL,
 issued_by CHAR(36) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_business_documents_number (number),
 KEY idx_business_documents_issue_date (issue_date),
 CONSTRAINT fk_business_documents_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL,
 CONSTRAINT fk_business_documents_issued_by FOREIGN KEY (issued_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_document_items (
 id CHAR(36) NOT NULL PRIMARY KEY,
 document_id CHAR(36) NOT NULL,
 service_id VARCHAR(40) NULL,
 description VARCHAR(255) NOT NULL,
 details TEXT NULL,
 quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
 unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
 line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_business_document_items_document (document_id),
 CONSTRAINT fk_business_document_items_document FOREIGN KEY (document_id) REFERENCES business_documents (id) ON DELETE CASCADE,
 CONSTRAINT fk_business_document_items_service FOREIGN KEY (service_id) REFERENCES service_catalog (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
 id CHAR(36) NOT NULL PRIMARY KEY,
 module VARCHAR(80) NOT NULL,
 action VARCHAR(190) NOT NULL,
 entity_type VARCHAR(80) NOT NULL,
 entity_id VARCHAR(80) NULL,
 entity_label VARCHAR(255) NULL,
 metadata JSON NULL,
 performed_by CHAR(36) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_audit_logs_created_at (created_at),
 KEY idx_audit_logs_module (module),
 CONSTRAINT fk_audit_logs_user FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
 setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
 setting_value MEDIUMTEXT NOT NULL,
 updated_by CHAR(36) NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_app_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO service_catalog (
 id, code, name, category, description, base_price, promotional_price, is_promotional,
 vat_enabled, vat_included, vat_rate, duration_minutes, is_active
) VALUES
 ('s1', 'SRV-001', 'Lavagem Simples', 'Viaturas Ligeiras', 'Lavagem por fora, limpeza das rodas e aspiracao basica para o dia a dia.', 300.00, NULL, 0, 1, 0, 16.00, 24, 1),
 ('s2', 'SRV-002', 'Lavagem Completa', 'Viaturas Ligeiras', 'Lavagem interior e exterior, com aspiracao completa, limpeza detalhada de vidros e um acabamento bonito.', 500.00, NULL, 0, 1, 0, 16.00, 35, 1),
 ('s9', 'SRV-003', 'Lavagem Completa + Chassi', 'Viaturas Ligeiras', 'O mesmo pacote da lavagem completa, agora com limpeza adicional de chassi para remover lama, poeira e sujidade acumulada na parte inferior da viatura.', 750.00, NULL, 0, 1, 0, 16.00, 50, 1),
 ('s11', 'SRV-004', 'Lavagem de Motor', 'Viaturas Ligeiras', 'Lavagem dedicada apenas ao motor, com cuidado nas partes sensiveis e remocao de poeira, oleo leve e sujidade acumulada.', 250.00, NULL, 0, 1, 0, 16.00, 20, 1),
 ('s3', 'SRV-005', 'Super Lavagem Completa', 'Viaturas Ligeiras', 'Servico completo para quem quer um tratamento mais profundo, com motor, chassis e interior bem cuidado.', 2500.00, NULL, 0, 1, 0, 16.00, 70, 1),
 ('s4', 'SRV-006', 'Limpeza de Bancos', 'Limpeza & Brilho', 'Limpeza profunda dos bancos, teto e carpetes para tirar manchas, poeira e maus cheiros.', 2500.00, NULL, 0, 1, 0, 16.00, 95, 1),
 ('s5', 'SRV-007', 'Polimento de Pintura', 'Limpeza & Brilho', 'Polimento para devolver brilho intenso e deixar a pintura com melhor aparencia.', 4500.00, NULL, 0, 1, 0, 16.00, 190, 1),
 ('s10', 'SRV-008', 'Pacote Empresarial', 'Empresas & Frotas', 'Pacote especial para empresas publicas, privadas, sociedades e frotas com atendimento recorrente e condicoes comerciais.', 3500.00, NULL, 0, 1, 0, 16.00, NULL, 1),
 ('s6', 'SRV-009', 'Lavagem de Motas', 'Motas, Camiões & Maquinas', 'Lavagem cuidada para motas, com atencao as carenagens, corrente, rodas e partes sensiveis.', 150.00, NULL, 0, 1, 0, 16.00, 16, 1),
 ('s7', 'SRV-010', 'Lavagem de Camiões', 'Motas, Camiões & Maquinas', 'Lavagem forte da cabine e do chassis para tirar lama, poeira e graxa do trabalho do dia.', 1500.00, NULL, 0, 1, 0, 16.00, 95, 1),
 ('s8', 'SRV-011', 'Lavagem de Maquinas', 'Motas, Camiões & Maquinas', 'Limpeza tecnica para tratores e outras maquinas, com foco em lama, oleo e sujidade pesada.', 2000.00, NULL, 0, 1, 0, 16.00, 140, 1)
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
 is_active = VALUES(is_active);
