"""
Script para adicionar a coluna clinic_id à tabela prontuarios
sem perder os dados existentes
"""
from sqlalchemy import text
from app.db.base import SessionLocal

def add_clinic_id_column():
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='prontuarios' AND column_name='clinic_id';
        """))
        
        if result.fetchone():
            print("✅ Coluna clinic_id já existe em prontuarios")
            return
        
        # Adicionar coluna clinic_id
        print("🔧 Adicionando coluna clinic_id à tabela prontuarios...")
        db.execute(text("""
            ALTER TABLE prontuarios 
            ADD COLUMN clinic_id INTEGER;
        """))
        
        # Adicionar constraint de chave estrangeira
        print("🔗 Adicionando constraint de chave estrangeira...")
        db.execute(text("""
            ALTER TABLE prontuarios 
            ADD CONSTRAINT fk_prontuarios_clinic_id 
            FOREIGN KEY (clinic_id) REFERENCES clinicas(id);
        """))
        
        # Preencher clinic_id com base no paciente (assumindo que cada paciente tem uma clínica)
        print("📝 Preenchendo clinic_id baseado nos dados existentes...")
        db.execute(text("""
            UPDATE prontuarios 
            SET clinic_id = (
                SELECT clinic_id FROM pacientes 
                WHERE pacientes.id = prontuarios.patient_id
            );
        """))
        
        db.commit()
        print("✅ Coluna clinic_id adicionada com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_clinic_id_column()
