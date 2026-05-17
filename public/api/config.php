<?php

function config_env(string $key, ?string $default = null): ?string
{
 $value = getenv($key);
 if ($value === false || $value === '') {
 return $default;
 }

 return $value;
}

return [
 'db' => [
 'host' => config_env('DB_HOST', 'srv2104.hstgr.io'),
 'port' => (int) config_env('DB_PORT', '3306'),
 'name' => config_env('DB_NAME', 'u178468876_carwash46'),
 'user' => config_env('DB_USER', 'u178468876_carwash46'),
 'password' => config_env('DB_PASSWORD', ''),
 'charset' => config_env('DB_CHARSET', 'utf8mb4'),
 ],
 'auth' => [
 'session_name' => config_env('APP_SESSION_NAME', 'doctor46_session'),
 'super_admin' => [
 'email' => config_env('SUPER_ADMIN_EMAIL', 'geral@carwash46.com'),
 'full_name' => config_env('SUPER_ADMIN_FULL_NAME', 'Super Admin'),
 'phone' => config_env('SUPER_ADMIN_PHONE', '+258 87 412 4865'),
 'password' => config_env('SUPER_ADMIN_PASSWORD', ''),
 ],
 ],
 'setup' => [
 'token' => config_env('SETUP_TOKEN', ''),
 ],
 'openrouter' => [
 'api_key' => config_env('OPENROUTER_API_KEY', ''),
 'endpoint' => config_env('OPENROUTER_API_ENDPOINT', 'https://api.openrouter.ai/v1/chat/completions'),
 ],
];
