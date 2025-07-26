-- Trading Dashboard Database Schema Export
-- Generated on: 2025-01-26
-- This file contains the complete database schema structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS eod_price_report CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS backtest_trades CASCADE;
DROP TABLE IF EXISTS backtests CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS exclusive_strategies CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS configurations CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (core authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_image_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session storage table (required for authentication)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create index on session expiry
CREATE INDEX idx_session_expire ON sessions(expire);

-- Accounts table (user financial data)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_balance DECIMAL(15,2),
    available_margin DECIMAL(15,2),
    used_margin DECIMAL(15,2),
    today_pnl DECIMAL(15,2),
    realized_pnl DECIMAL(15,2),
    upstox_access_token TEXT,
    upstox_refresh_token TEXT,
    upstox_user_id TEXT,
    upstox_token_expiry TIMESTAMP,
    upstox_token_type TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Configuration storage
CREATE TABLE configurations (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Strategies table
CREATE TABLE strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    strategy_code TEXT,
    parameters JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exclusive strategies (premium content)
CREATE TABLE exclusive_strategies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    strategy_code TEXT,
    parameters JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    access_level TEXT DEFAULT 'premium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Positions table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES strategies(id),
    symbol TEXT NOT NULL,
    exchange TEXT,
    side TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    order_type TEXT,
    status TEXT DEFAULT 'pending',
    pnl DECIMAL(12,2),
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Backtests table
CREATE TABLE backtests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES strategies(id),
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    initial_capital DECIMAL(15,2),
    final_capital DECIMAL(15,2),
    total_return DECIMAL(10,4),
    max_drawdown DECIMAL(10,4),
    sharpe_ratio DECIMAL(8,4),
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Backtest trades table
CREATE TABLE backtest_trades (
    id SERIAL PRIMARY KEY,
    backtest_id INTEGER REFERENCES backtests(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    entry_price DECIMAL(12,2),
    exit_price DECIMAL(12,2),
    entry_date TIMESTAMP,
    exit_date TIMESTAMP,
    pnl DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Modules table (system components)
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    version TEXT,
    is_active BOOLEAN DEFAULT true,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Logs table (system logging)
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    level TEXT NOT NULL,
    module TEXT,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    plan_id INTEGER REFERENCES subscription_plans(id) NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment methods
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    external_id TEXT,
    last_four TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    subscription_id INTEGER REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    provider TEXT,
    external_id TEXT,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE usage_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    feature TEXT NOT NULL,
    action TEXT NOT NULL,
    value INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Learning paths (gamification)
CREATE TABLE learning_paths (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT DEFAULT 'beginner',
    estimated_duration TEXT,
    prerequisites JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    path_id INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    lesson_type TEXT DEFAULT 'reading',
    duration_minutes INTEGER,
    order_index INTEGER,
    prerequisites JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started',
    score INTEGER,
    time_spent_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Achievements
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    points INTEGER DEFAULT 0,
    requirements JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- User statistics
CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
    total_strategies_created INTEGER DEFAULT 0,
    total_backtests_run INTEGER DEFAULT 0,
    best_strategy_return DECIMAL(10,4) DEFAULT 0,
    total_lessons_completed INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- EOD Price Report table (main financial data)
CREATE TABLE eod_price_report (
    symbol VARCHAR(50) NOT NULL,
    expiry_dt DATE NOT NULL,
    trade_date DATE NOT NULL,
    open DECIMAL(12,2),
    high DECIMAL(12,2),
    low DECIMAL(12,2),
    cmp DECIMAL(12,2),
    cash_chg DECIMAL(12,2),
    indx_grp VARCHAR(50),
    indx_wtg DECIMAL(12,2),
    put_int DECIMAL(12,2),
    call_int DECIMAL(12,2),
    comb_int DECIMAL(12,2),
    call_low DECIMAL(12,2),
    call_high DECIMAL(12,2),
    put_high DECIMAL(12,2),
    put_low DECIMAL(12,2),
    unused_pc DECIMAL(12,2),
    unused_pc_rev DECIMAL(12,2),
    trend_price1 DECIMAL(12,2),
    trend_price2 DECIMAL(12,2),
    call_oi BIGINT,
    put_oi BIGINT,
    call_diff DECIMAL(12,2),
    put_diff DECIMAL(12,2),
    comb_diff DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (symbol, expiry_dt, trade_date)
);

-- Create essential indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_strategy_id ON positions(strategy_id);
CREATE INDEX idx_backtests_user_id ON backtests(user_id);
CREATE INDEX idx_backtest_trades_backtest_id ON backtest_trades(backtest_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_eod_price_report_symbol ON eod_price_report(symbol);
CREATE INDEX idx_eod_price_report_trade_date ON eod_price_report(trade_date);
CREATE INDEX idx_eod_price_report_expiry_dt ON eod_price_report(expiry_dt);

-- Insert default configuration values
INSERT INTO configurations (key, value, description) VALUES
('app_name', 'Trading Dashboard', 'Application name'),
('app_version', '1.0.0', 'Current application version'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('max_strategies_per_user', '50', 'Maximum strategies per user'),
('max_backtests_per_user', '100', 'Maximum backtests per user');

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features) VALUES
('Free', 'Basic features for beginners', 0.00, 'monthly', '["Basic strategies", "Limited backtesting", "Community support"]'),
('Pro', 'Advanced features for serious traders', 29.99, 'monthly', '["Unlimited strategies", "Advanced backtesting", "Real-time data", "Priority support"]'),
('Premium', 'All features including exclusive strategies', 99.99, 'monthly', '["All Pro features", "Exclusive strategies", "Custom indicators", "Personal consultation"]');

-- Insert default achievements
INSERT INTO achievements (title, description, icon, category, points, requirements) VALUES
('First Strategy', 'Create your first trading strategy', '🎯', 'strategy', 100, '{"strategies_created": 1}'),
('Strategy Master', 'Create 10 trading strategies', '🏆', 'strategy', 500, '{"strategies_created": 10}'),
('Backtest Rookie', 'Run your first backtest', '📊', 'backtest', 100, '{"backtests_run": 1}'),
('Backtest Pro', 'Run 50 backtests', '🎖️', 'backtest', 1000, '{"backtests_run": 50}'),
('Learner', 'Complete your first lesson', '📚', 'learning', 50, '{"lessons_completed": 1}'),
('Scholar', 'Complete 10 lessons', '🎓', 'learning', 500, '{"lessons_completed": 10}');

-- Insert default learning path
INSERT INTO learning_paths (title, description, difficulty_level, estimated_duration) VALUES
('Trading Fundamentals', 'Learn the basics of algorithmic trading', 'beginner', '2-3 hours'),
('Advanced Strategies', 'Master complex trading strategies', 'advanced', '5-6 hours'),
('Risk Management', 'Learn proper risk management techniques', 'intermediate', '3-4 hours');

-- Insert sample lessons
INSERT INTO lessons (path_id, title, content, lesson_type, duration_minutes, order_index) VALUES
(1, 'Introduction to Algorithmic Trading', 'Learn what algorithmic trading is and how it works...', 'reading', 30, 1),
(1, 'Market Data Basics', 'Understanding market data and price feeds...', 'reading', 45, 2),
(1, 'Your First Strategy', 'Build a simple moving average strategy...', 'interactive', 60, 3);

-- Create admin user (password should be changed in production)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@tradingpro.ai', '$2b$10$example_hash_change_in_production', 'Admin', 'User', 'admin');

-- Initialize user stats for admin
INSERT INTO user_stats (user_id) VALUES (1);

-- Insert sample account data for admin
INSERT INTO accounts (user_id, total_balance, available_margin, used_margin, today_pnl, realized_pnl) VALUES
(1, 100000.00, 80000.00, 20000.00, 1500.50, 5250.75);

COMMENT ON TABLE users IS 'Core user authentication and profile data';
COMMENT ON TABLE eod_price_report IS 'End-of-day price reports with options data and technical indicators';
COMMENT ON TABLE strategies IS 'User-created trading strategies';
COMMENT ON TABLE backtests IS 'Strategy backtesting results and performance metrics';
COMMENT ON TABLE learning_paths IS 'Gamified learning paths for trading education';
COMMENT ON TABLE subscription_plans IS 'Subscription tiers and pricing';

-- Database schema export completed successfully!