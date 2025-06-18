INSERT INTO permission (code, name, category)
VALUES ('visa.edit', 'edit', 'visa')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('visa.view', 'view', 'visa')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('order.edit', 'edit', 'order')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('order.discount', 'discount', 'order')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('trip.assignBus', 'assign bus', 'trip')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('finance.view', 'view', 'finance')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (code, name, category)
VALUES ('finance.export', 'export', 'finance')
ON CONFLICT (code) DO NOTHING;
