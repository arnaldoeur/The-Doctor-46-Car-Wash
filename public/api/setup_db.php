<?php

declare(strict_types=1);

/**
 * Script de Configuração Inicial da Base de Dados
 * Este script cria as tabelas e insere os dados iniciais.
 */

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

try {
 $setupToken = (string) (app_config()['setup']['token'] ?? '');
 if ($setupToken !== '') {
 $providedToken = (string) ($_GET['token'] ?? '');
 if (!hash_equals($setupToken, $providedToken)) {
 http_response_code(403);
 echo "Acesso negado. Token de configuracao invalido.\n";
 exit;
 }
 }

 echo "Iniciando configuração da base de dados...\n";

 $pdo = db(false);
 $config = app_config()['db'];

 echo "Conectado à base de dados: {$config['name']} em {$config['host']}\n";

 // Caminho para o arquivo SQL
 // Como este script está em public/api, o schema está em ../../mysql/schema.sql
 $sqlFile = __DIR__ . '/schema.sql';
 if (!is_file($sqlFile)) {
 $sqlFile = dirname(__DIR__, 2) . '/database/schema.sql';
 }

 if (!is_file($sqlFile)) {
 throw new Exception("Arquivo de schema não encontrado em: $sqlFile");
 }

 echo "Lendo arquivo de schema...\n";
 $sql = file_get_contents($sqlFile);

 // Remover comentários de linha única
 $sql = preg_replace('/--.*$/m', '', $sql);
 
 // Dividir o SQL em comandos individuais
 // Nota: Esta é uma divisão simples por ponto e vírgula. 
 // Pode falhar se houver ponto e vírgula dentro de strings, mas o schema.sql parece simples.
 $commands = explode(';', $sql);

 echo "Executando comandos...\n";
 $count = 0;
 foreach ($commands as $command) {
 $trimmed = trim($command);
 if ($trimmed !== '') {
 $pdo->exec($trimmed);
 $count++;
 }
 }

 ensure_default_super_admin($pdo);

 echo "Sucesso! $count comandos executados.\n";
 echo "A estrutura da base de dados foi criada/atualizada.\n";
 echo "O super admin padrao foi verificado/criado quando a palavra-passe estiver configurada.\n";

} catch (PDOException $e) {
 echo "ERRO DE BASE DE DADOS:\n" . $e->getMessage() . "\n";
 echo "\nVerifique se as credenciais no arquivo config.php estão corretas e se o acesso remoto está permitido na Hostinger.\n";
} catch (Throwable $e) {
 echo "ERRO:\n" . $e->getMessage() . "\n";
}
