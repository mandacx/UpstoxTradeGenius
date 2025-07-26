-- Sample Data for Trading Dashboard
-- This file contains sample data for development and testing

-- Insert sample EOD price data
INSERT INTO eod_price_report (
    symbol, expiry_dt, trade_date, open, high, low, cmp, cash_chg, indx_grp, indx_wtg,
    put_int, call_int, comb_int, call_low, call_high, put_high, put_low,
    unused_pc, unused_pc_rev, trend_price1, trend_price2, call_oi, put_oi,
    call_diff, put_diff, comb_diff
) VALUES
-- RELIANCE sample data
('RELIANCE', '2025-06-26', '2025-01-26', 2850.00, 2875.50, 2840.25, 2865.75, 15.25, 'NIFTY50', 9.85,
 2820.50, 2890.25, 2855.38, 2875.60, 2905.80, 2835.40, 2810.30,
 2.45, 1.85, 2860.75, 2870.25, 15750000, 12850000,
 2885.60, 2825.40, 2855.50),

('RELIANCE', '2025-06-26', '2025-01-25', 2835.50, 2860.75, 2825.00, 2850.50, -5.75, 'NIFTY50', 9.85,
 2805.25, 2875.80, 2840.53, 2860.40, 2890.60, 2820.15, 2795.80,
 2.20, 1.65, 2845.30, 2855.80, 14250000, 11950000,
 2870.25, 2810.60, 2840.43),

-- HDFC sample data  
('HDFCBANK', '2025-06-26', '2025-01-26', 1685.50, 1695.75, 1678.25, 1690.25, 4.75, 'NIFTY50', 11.25,
 1665.80, 1710.40, 1688.10, 1695.50, 1720.30, 1670.90, 1650.60,
 1.85, 1.25, 1687.50, 1692.80, 18500000, 16250000,
 1705.25, 1670.35, 1687.80),

('HDFCBANK', '2025-06-26', '2025-01-25', 1680.25, 1690.50, 1675.80, 1685.50, -2.25, 'NIFTY50', 11.25,
 1660.45, 1705.85, 1683.15, 1690.25, 1715.60, 1665.70, 1645.30,
 1.70, 1.15, 1682.75, 1688.20, 17800000, 15750000,
 1700.60, 1665.80, 1683.20),

-- INFY sample data
('INFY', '2025-06-26', '2025-01-26', 1825.75, 1835.50, 1820.25, 1830.50, 4.75, 'NIFTY50', 4.15,
 1810.30, 1845.60, 1827.95, 1835.25, 1855.80, 1815.40, 1795.50,
 1.95, 1.45, 1828.75, 1832.25, 12750000, 10850000,
 1840.85, 1815.65, 1828.25),

('INFY', '2025-06-26', '2025-01-25', 1820.50, 1830.25, 1815.75, 1825.75, -1.25, 'NIFTY50', 4.15,
 1805.85, 1840.30, 1823.08, 1830.50, 1850.45, 1810.20, 1790.75,
 1.80, 1.35, 1823.50, 1827.00, 12250000, 10450000,
 1835.60, 1810.40, 1823.00),

-- TCS sample data
('TCS', '2025-06-26', '2025-01-26', 4125.25, 4145.80, 4115.50, 4135.75, 10.50, 'NIFTY50', 5.85,
 4095.60, 4165.40, 4130.50, 4145.25, 4180.60, 4105.80, 4075.30,
 2.85, 2.15, 4132.50, 4138.25, 8950000, 7850000,
 4155.80, 4110.25, 4132.83),

('TCS', '2025-06-26', '2025-01-25', 4115.50, 4135.25, 4105.75, 4125.25, -5.25, 'NIFTY50', 5.85,
 4085.30, 4155.70, 4120.50, 4135.50, 4170.85, 4095.60, 4065.80,
 2.65, 1.95, 4122.75, 4128.50, 8650000, 7550000,
 4145.95, 4100.45, 4123.20),

-- ICICIBANK sample data
('ICICIBANK', '2025-06-26', '2025-01-26', 1275.50, 1285.75, 1270.25, 1280.50, 5.00, 'NIFTY50', 7.45,
 1260.80, 1295.40, 1278.10, 1285.50, 1305.30, 1265.90, 1245.60,
 1.75, 1.35, 1277.50, 1282.80, 22500000, 19250000,
 1290.25, 1265.35, 1277.80),

('ICICIBANK', '2025-06-26', '2025-01-25', 1270.25, 1280.50, 1265.80, 1275.50, -2.50, 'NIFTY50', 7.45,
 1255.45, 1290.85, 1273.15, 1280.25, 1300.60, 1260.70, 1240.30,
 1.60, 1.25, 1272.75, 1278.20, 21800000, 18750000,
 1285.60, 1260.80, 1273.20);

-- Insert sample strategies
INSERT INTO strategies (user_id, name, description, strategy_code, parameters, performance) VALUES
(1, 'Moving Average Crossover', 'Simple MA crossover strategy using 20 and 50 period MAs', 
 'def strategy(data): return signal', 
 '{"short_ma": 20, "long_ma": 50, "stop_loss": 0.02}',
 '{"total_return": 0.15, "sharpe_ratio": 1.25, "max_drawdown": 0.08}'),

(1, 'RSI Momentum', 'RSI-based momentum strategy with overbought/oversold signals',
 'def rsi_strategy(data): return rsi_signal',
 '{"rsi_period": 14, "oversold": 30, "overbought": 70}',
 '{"total_return": 0.12, "sharpe_ratio": 1.05, "max_drawdown": 0.12}'),

(1, 'Bollinger Band Breakout', 'Breakout strategy using Bollinger Bands',
 'def bb_strategy(data): return bb_signal',
 '{"period": 20, "std_dev": 2, "breakout_threshold": 0.01}',
 '{"total_return": 0.18, "sharpe_ratio": 1.35, "max_drawdown": 0.06}');

-- Insert sample exclusive strategies
INSERT INTO exclusive_strategies (name, description, strategy_code, parameters, performance, access_level) VALUES
('Advanced Options Strategy', 'Sophisticated options trading strategy using Greeks and volatility',
 'def options_strategy(data): return options_signal',
 '{"delta_threshold": 0.5, "gamma_limit": 0.1, "theta_decay": 0.05}',
 '{"total_return": 0.28, "sharpe_ratio": 1.85, "max_drawdown": 0.04}',
 'premium'),

('High Frequency Arbitrage', 'HFT arbitrage strategy exploiting price differences',
 'def hft_arbitrage(data): return arb_signal',
 '{"min_spread": 0.001, "execution_speed": "ultra_fast", "risk_limit": 0.001}',
 '{"total_return": 0.45, "sharpe_ratio": 2.15, "max_drawdown": 0.02}',
 'premium');

-- Insert sample backtests
INSERT INTO backtests (user_id, strategy_id, name, start_date, end_date, initial_capital, final_capital, total_return, max_drawdown, sharpe_ratio, status) VALUES
(1, 1, 'MA Crossover Backtest - Q4 2024', '2024-10-01', '2024-12-31', 100000.00, 115000.00, 0.15, 0.08, 1.25, 'completed'),
(1, 2, 'RSI Strategy Test - H2 2024', '2024-07-01', '2024-12-31', 100000.00, 112000.00, 0.12, 0.12, 1.05, 'completed'),
(1, 3, 'BB Breakout - Full Year 2024', '2024-01-01', '2024-12-31', 100000.00, 118000.00, 0.18, 0.06, 1.35, 'completed');

-- Insert sample backtest trades
INSERT INTO backtest_trades (backtest_id, symbol, side, quantity, entry_price, exit_price, entry_date, exit_date, pnl) VALUES
(1, 'RELIANCE', 'buy', 100, 2800.00, 2850.00, '2024-10-15 10:30:00', '2024-10-20 15:45:00', 5000.00),
(1, 'HDFCBANK', 'buy', 50, 1650.00, 1680.00, '2024-11-05 09:15:00', '2024-11-12 14:20:00', 1500.00),
(1, 'INFY', 'sell', 75, 1850.00, 1820.00, '2024-11-20 11:00:00', '2024-11-25 16:00:00', 2250.00),

(2, 'TCS', 'buy', 25, 4100.00, 4150.00, '2024-08-10 10:00:00', '2024-08-15 15:30:00', 1250.00),
(2, 'ICICIBANK', 'buy', 80, 1250.00, 1280.00, '2024-09-05 09:30:00', '2024-09-10 14:45:00', 2400.00),

(3, 'RELIANCE', 'buy', 120, 2750.00, 2820.00, '2024-03-15 10:15:00', '2024-03-22 15:00:00', 8400.00),
(3, 'HDFCBANK', 'sell', 60, 1700.00, 1670.00, '2024-06-10 11:30:00', '2024-06-15 16:15:00', 1800.00);

-- Insert sample positions
INSERT INTO positions (user_id, strategy_id, symbol, exchange, side, quantity, price, order_type, status, pnl) VALUES
(1, 1, 'RELIANCE', 'NSE', 'buy', 50, 2865.75, 'market', 'executed', 750.50),
(1, 1, 'HDFCBANK', 'NSE', 'buy', 30, 1690.25, 'limit', 'executed', 425.25),
(1, 2, 'INFY', 'NSE', 'sell', 40, 1830.50, 'market', 'executed', -280.75),
(1, 3, 'TCS', 'NSE', 'buy', 15, 4135.75, 'limit', 'pending', 0.00);

-- Insert sample modules
INSERT INTO modules (name, description, version, is_active, data) VALUES
('upstox_connector', 'Upstox API integration module', '1.2.0', true, '{"api_version": "v2", "rate_limit": 1000}'),
('strategy_engine', 'Core strategy execution engine', '2.1.0', true, '{"max_concurrent": 10, "timeout": 30}'),
('risk_manager', 'Risk management and position sizing', '1.5.0', true, '{"max_position_size": 0.1, "stop_loss": 0.02}'),
('data_feed', 'Real-time market data feed', '1.8.0', true, '{"providers": ["upstox", "backup"], "latency_ms": 50}');

-- Insert sample logs
INSERT INTO logs (level, module, message, metadata) VALUES
('info', 'strategy_engine', 'Strategy execution started', '{"strategy_id": 1, "user_id": 1}'),
('info', 'upstox_connector', 'Successfully connected to Upstox API', '{"api_version": "v2"}'),
('warning', 'risk_manager', 'Position size exceeds recommended limit', '{"position_size": 0.15, "recommended": 0.1}'),
('error', 'data_feed', 'Temporary connection loss to primary feed', '{"provider": "upstox", "retry_count": 3}'),
('info', 'data_feed', 'Switched to backup data provider', '{"provider": "backup"}'),
('info', 'strategy_engine', 'Backtest completed successfully', '{"backtest_id": 1, "duration_ms": 45000}');

-- Insert sample user progress
INSERT INTO user_progress (user_id, lesson_id, status, score, time_spent_minutes, completed_at) VALUES
(1, 1, 'completed', 85, 32, '2025-01-20 14:30:00'),
(1, 2, 'completed', 92, 48, '2025-01-21 16:45:00'),
(1, 3, 'in_progress', null, 25, null);

-- Insert sample user achievements
INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
(1, 1, '2025-01-15 10:30:00'),  -- First Strategy
(1, 3, '2025-01-18 14:20:00'),  -- Backtest Rookie
(1, 5, '2025-01-20 14:30:00');  -- Learner

-- Update user stats for admin user
UPDATE user_stats SET 
    total_strategies_created = 3,
    total_backtests_run = 3,
    best_strategy_return = 0.18,
    total_lessons_completed = 2,
    current_streak_days = 5,
    total_points = 250,
    level = 2,
    updated_at = NOW()
WHERE user_id = 1;

-- Insert sample usage analytics
INSERT INTO usage_analytics (user_id, feature, action, value, metadata) VALUES
(1, 'strategy_builder', 'create', 1, '{"strategy_type": "ma_crossover"}'),
(1, 'strategy_builder', 'create', 1, '{"strategy_type": "rsi_momentum"}'),
(1, 'strategy_builder', 'create', 1, '{"strategy_type": "bb_breakout"}'),
(1, 'backtesting', 'run', 1, '{"strategy_id": 1, "duration_days": 92}'),
(1, 'backtesting', 'run', 1, '{"strategy_id": 2, "duration_days": 153}'),
(1, 'backtesting', 'run', 1, '{"strategy_id": 3, "duration_days": 365}'),
(1, 'learning', 'lesson_complete', 1, '{"lesson_id": 1, "score": 85}'),
(1, 'learning', 'lesson_complete', 1, '{"lesson_id": 2, "score": 92}'),
(1, 'dashboard', 'view', 15, '{"session_count": 15}'),
(1, 'eod_reports', 'export', 3, '{"format": "csv", "rows": 150}');

-- Sample data insertion completed successfully!
-- This provides a realistic dataset for development and testing purposes.