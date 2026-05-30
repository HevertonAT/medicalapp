ALTER TABLE agendamentos
  ALTER COLUMN status TYPE integer
  USING CASE
    WHEN status = 'agendado' THEN 1
    WHEN status = 'em_andamento' THEN 2
    WHEN status = 'realizado' THEN 3
    WHEN status = 'cancelado' THEN 4
    WHEN status = 'reagendado' THEN 5
    ELSE 1
  END;
