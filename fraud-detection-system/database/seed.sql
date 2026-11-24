INSERT INTO claims (client_id, amount, claim_type, location, previous_claims, fraud_score, risk_level, flagged, reasons, status) VALUES
('C100', 1200,   'Health',   'Nairobi', 0, 0.047, 'low',  false, '[]', 'approved'),
('C101', 170000, 'Crop',     'Embu',    2, 0.881, 'high', true,
 '[{"code":"AMOUNT_VERY_HIGH","weight":2.5,"reason":"Amount is 2.1x the typical maximum for Crop claims"},{"code":"RECENT_CLAIM","weight":0.8,"reason":"Client filed another claim in the last 30 days"}]',
 'pending_review'),
('C102', 800,    'Property', 'Kisumu',  1, 0.047, 'low',  false, '[]', 'approved');
