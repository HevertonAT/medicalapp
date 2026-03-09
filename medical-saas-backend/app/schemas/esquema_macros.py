from pydantic import BaseModel

class MacroCreate(BaseModel):
    titulo: str
    texto_padrao: str

class MacroResponse(BaseModel):
    id: int
    titulo: str
    texto_padrao: str
    doctor_id: int

    class Config:
        from_attributes = True