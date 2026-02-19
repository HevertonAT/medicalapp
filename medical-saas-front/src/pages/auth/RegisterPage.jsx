import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button"; // Ajuste o caminho se necessário
import { Input } from "@/components/ui/input";   // Ajuste o caminho se necessário
import { Label } from "@/components/ui/label";   // Ajuste o caminho se necessário
import api from "@/services/api"; // Seu arquivo de configuração do axios

// 1. Schema de Validação com Zod
// Define as regras para cada campo do formulário
const registerSchema = z.object({
  full_name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("Insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  // Validar data como string no formato DD/MM/AAAA é complexo,
  // por simplicidade, vamos garantir que não está vazia.
  // O ideal no futuro é usar um componente de DatePicker ou uma máscara.
  birth_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato inválido (DD/MM/AAAA)").optional().or(z.literal('')),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 2. Configuração do React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      birth_date: "",
    },
  });

  // 3. Função de Envio do Formulário
  async function onSubmit(data) {
    setIsLoading(true);
    setSubmitError("");

    try {
      // Adaptando os dados para o que seu backend espera.
      // NOTA: Seu backend atual (no registo) não parece aceitar data de nascimento ainda.
      // Você precisará ajustar o backend para salvar isso no perfil do paciente depois.
      const payload = {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: "patient", // Assumindo que quem se cadastra por aqui é paciente
        // birth_date: data.birth_date // O backend precisa estar pronto para receber isso
      };

      await api.post("/auth/register", payload);
      
      // Sucesso! Redireciona para o login
      navigate("/login", { state: { message: "Conta criada com sucesso! Faça login." } });
    } catch (error) {
      console.error("Erro ao registrar:", error);
      // Tenta pegar a mensagem de erro da API, senão usa uma genérica
      const errorMessage = error.response?.data?.detail || "Ocorreu um erro ao criar a conta. Tente novamente.";
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex">
      {/* --- LADO ESQUERDO (IMAGEM) --- */}
      {/* Oculto em telas pequenas (hidden), visível em telas grandes (lg:block) */}
      <div className="hidden lg:block w-1/2 bg-gray-100 relative">
        <img
          // Substitua por sua imagem local ou URL desejada
          src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="Mulher utilizando laptop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Camada de cor azul/roxa sobre a imagem para dar o efeito do design */}
        <div className="absolute inset-0 bg-blue-900 bg-opacity-40 mix-blend-multiply"></div>
      </div>

      {/* --- LADO DIREITO (FORMULÁRIO) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Cabeçalho do Formulário */}
          <div className="text-left">
            <h2 className="text-xl font-bold text-blue-600 mb-6">Clinify</h2>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Criar conta
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Entrar
              </Link>
            </p>
          </div>

          {/* Mensagem de Erro Geral */}
          {submitError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {submitError}
            </div>
          )}

          {/* O Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
            
            {/* Campo: Nome */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Seu nome completo"
                {...register("full_name")}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Campo: E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo: Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Campo: Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              {/* Usando type="text" com placeholder para simular o design. 
                  O ideal seria usar uma biblioteca de input mask aqui. */}
              <Input
                id="birth_date"
                type="text"
                placeholder="dd/mm/aaaa"
                maxLength={10}
                {...register("birth_date")}
                className={errors.birth_date ? "border-red-500" : ""}
                onChange={(e) => {
                    // Máscara simples para DD/MM/AAAA
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 8) value = value.slice(0, 8);
                    if (value.length >= 5) {
                        value = value.replace(/^(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
                    } else if (value.length >= 3) {
                         value = value.replace(/^(\d{2})(\d{1,2})/, '$1/$2');
                    }
                    e.target.value = value;
                    register("birth_date").onChange(e); // Atualiza o react-hook-form
                }}
              />
              {errors.birth_date && (
                <p className="text-red-500 text-xs mt-1">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Botão de Submit */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}