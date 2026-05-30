import psycopg2
conn = psycopg2.connect("postgresql://postgres:NeifxuhQBKgKEgJHmGxSBrRCinUCSOYK@zephyr.proxy.rlwy.net:12792/railway")
cur = conn.cursor()
cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'status';")
print(cur.fetchone())
cur.execute("SELECT id, status FROM agendamentos LIMIT 5;")
print(cur.fetchall())
conn.close()
