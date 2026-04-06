-- Replace UUID-based QR codes with the numeric entity ID
UPDATE assets SET qr_code = CAST(id AS CHAR);
UPDATE users  SET qr_code = CAST(id AS CHAR);
