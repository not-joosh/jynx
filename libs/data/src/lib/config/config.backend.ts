// Backend environment configuration for Supabase
export const backendConfig = {
    // Supabase Configuration
    supabase: {
      url: process.env['SUPABASE_URL'] || '',
      anonKey: process.env['SUPABASE_ANON_KEY'] || '',
      serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
    },
    
    // Database Configuration (Supabase)
    database: {
      url: process.env['DATABASE_URL'] || '',
      host: process.env['DB_HOST'] || '',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      username: process.env['DB_USERNAME'] || 'postgres',
      password: process.env['DB_PASSWORD'] || '',
      database: process.env['DB_DATABASE'] || 'postgres',
    },
    
    // JWT Configuration
    jwt: {
      secret: process.env['JWT_SECRET'] || 'thisismyverysecretsecretkeyHAHAHA',
      expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
    },
    
    // API Configuration
    api: {
      port: parseInt(process.env['API_PORT'] || '3000'),
      prefix: process.env['API_PREFIX'] || 'api/v1',
    },
    
    // Frontend Configuration
    frontend: {
      url: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    },
};
  