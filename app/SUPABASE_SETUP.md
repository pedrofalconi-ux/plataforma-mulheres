# Supabase Setup

O projeto agora aponta para:

- `https://nwjyftezuizmmirivvpi.supabase.co`

O schema principal ja foi aplicado nesse projeto novo. Se precisar recriar tudo ou limpar os dados, os scripts abaixo cobrem esse fluxo.

## Bootstrap completo

No diretorio `app`, rode:

```powershell
$env:DATABASE_URL="postgresql://postgres.nwjyftezuizmmirivvpi:SUA_SENHA_REAL@aws-1-us-west-2.pooler.supabase.com:6543/postgres"
node bootstrap_supabase.js
```

Se tambem quiser inserir dados iniciais:

```powershell
$env:DATABASE_URL="postgresql://postgres.nwjyftezuizmmirivvpi:SUA_SENHA_REAL@aws-1-us-west-2.pooler.supabase.com:6543/postgres"
$env:APPLY_SEED="true"
node bootstrap_supabase.js
```

## Reset da plataforma

Para apagar usuarios, perfis, trilhas, aulas, pedidos e demais dados operacionais, preservando apenas a configuracao institucional:

```powershell
$env:DATABASE_URL="postgresql://postgres.nwjyftezuizmmirivvpi:SUA_SENHA_REAL@aws-1-us-west-2.pooler.supabase.com:6543/postgres"
node reset_platform_data.js
```

## O que os scripts fazem

- `bootstrap_supabase.js`: aplica todas as migrations em `app/supabase/migrations`
- `apply_backend_compat.js`: reaplica a migration de compatibilidade institucional
- `reset_platform_data.js`: limpa o banco operacional e resemeia `institutional_content`
