import { useState } from 'react';
import {
  Flex, Box, FormControl, FormLabel, Input, Button, Heading, Text,
  useToast, VStack, useColorModeValue, Link as ChakraLink
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ColorModeSwitcher } from '../components/ColorModeSwitcher';
import { API_BASE } from '../services/api';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [role, setRole] = useState('patient'); 
  
  // Novos campos
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState(''); 

  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();

  // --- CORES DO MODO NOTURNO ---
  const bgPage = useColorModeValue('gray.50', 'gray.900');
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const placeholderColor = 'gray.500';

  // --- MÁSCARAS E VALIDAÇÕES ---
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.slice(0, 11); 
    
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelefone(value);
  };

  const validarCPF = (cpfInput) => {
    const cpfLimpo = cpfInput.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) return false; 
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
    return true;
  };

  const validarEmail = (emailInput) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailInput);
  };

  // --- AÇÃO DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', email); 
      params.append('password', password);

      const response = await axios.post(
        `${API_BASE}/auth/login`, 
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const token = response.data.access_token;
      const userRole = response.data.role;

      localStorage.setItem('medical_token', token);
      if (userRole) localStorage.setItem('user_role', userRole);

      toast({ title: 'Bem-vindo(a)!', status: 'success', duration: 2000, isClosable: true });
      
      if (userRole === 'patient' || userRole === 'paciente') {
          navigate("/minha-saude"); 
      } else {
          navigate("/dashboard");
      }
      
    } catch (error) {
      let mensagem = "Erro ao conectar.";
      if (error.response) {
        if (error.response.status === 401) mensagem = "E-mail ou senha incorretos.";
        else if (error.response.status === 422) mensagem = "Formato de dados inválido (Erro 422).";
        else mensagem = "Erro no servidor: " + error.response.status;
      } else if (error.code === "ERR_NETWORK") {
        mensagem = "Não foi possível conectar ao Backend. Verifique se o servidor está rodando.";
      }
      toast({ title: 'Falha no login', description: mensagem, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // --- AÇÃO DE CADASTRO ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validarEmail(email)) {
        toast({ title: 'E-mail Inválido', description: 'O formato do e-mail está incorreto.', status: 'warning', duration: 4000 });
        return;
    }

    if (password !== confirmPass) {
        toast({ title: 'Senhas não conferem', status: 'warning', duration: 3000 });
        return;
    }

    if (!validarCPF(cpf)) {
        toast({ title: 'CPF Inválido', description: 'Por favor, insira um CPF válido.', status: 'error', duration: 4000 });
        return;
    }

    if (!dataNascimento) {
        toast({ title: 'Data Inválida', description: 'A data de nascimento é obrigatória.', status: 'warning' });
        return;
    }

    if (telefone.replace(/\D/g, '').length < 10) {
        toast({ title: 'Telefone Inválido', description: 'Insira um número de telefone válido com DDD.', status: 'warning' });
        return;
    }

    setIsLoading(true);
    try {
        await axios.post(`${API_BASE}/auth/register`, {
            full_name: name,
            email: email,
            password: password,
            role: role,
            cpf: cpf.replace(/\D/g, ''), 
            data_nascimento: dataNascimento,
            telefone: telefone.replace(/\D/g, '') 
        });

        toast({ 
            title: 'Conta criada com sucesso!', 
            description: "Faça login para acessar o sistema.", 
            status: 'success', 
            duration: 4000 
        });
        
        setIsLoginView(true); 
        setPassword('');
        setConfirmPass('');
        setCpf('');
        setDataNascimento('');
        setTelefone('');

    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.detail || "Erro ao criar conta. Verifique se o e-mail ou CPF já estão em uso.";
        toast({ title: 'Erro no cadastro', description: msg, status: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={bgPage} position="relative" py={12}>
      
      <Box position="absolute" top={4} right={4}>
        <ColorModeSwitcher />
      </Box>

      <Box rounded={'lg'} bg={bgCard} boxShadow={'lg'} p={8} width={['90%', '400px']}>
        <VStack spacing={4}>
          <Heading fontSize={'2xl'} color={headingColor} textAlign="center">
            {isLoginView ? 'Acesso à Clínica' : 'Crie sua Conta'}
          </Heading>
          <Text fontSize={'md'} color={textColor} textAlign="center">
            {isLoginView ? 'Entre para gerenciar seus agendamentos' : 'Preencha seus dados para começar.'}
          </Text>
        </VStack>

        <Box as="form" mt={8} onSubmit={isLoginView ? handleLogin : handleRegister}>
          <VStack spacing={4}>
            
            {/* Campos exclusivos de Cadastro */}
            {!isLoginView && (
                <>
                    <FormControl isRequired>
                        <FormLabel color={headingColor}>Nome Completo</FormLabel>
                        <Input 
                            type="text" bg={inputBg} borderColor={borderColor} color={headingColor}
                            value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" 
                            _placeholder={{ color: placeholderColor }}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel color={headingColor}>CPF</FormLabel>
                        <Input 
                            type="text" bg={inputBg} borderColor={borderColor} color={headingColor}
                            value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" 
                            _placeholder={{ color: placeholderColor }}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel color={headingColor}>Data de Nascimento</FormLabel>
                        <Input 
                            type="date" 
                            max={maxDate} 
                            bg={inputBg} 
                            borderColor={borderColor} 
                            // Lógica de cor: Fica cinza se vazio (efeito placeholder), e forte se preenchido
                            color={dataNascimento ? headingColor : placeholderColor}
                            value={dataNascimento} 
                            onChange={(e) => setDataNascimento(e.target.value)}
                            css={{
                              // Inverte a cor do ícone de calendário no modo noturno para ficar visível
                              '&::-webkit-calendar-picker-indicator': {
                                filter: useColorModeValue('none', 'invert(1)'),
                                cursor: 'pointer'
                              }
                            }}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel color={headingColor}>Telefone / WhatsApp</FormLabel>
                        <Input 
                            type="tel" bg={inputBg} borderColor={borderColor} color={headingColor}
                            value={telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" 
                            _placeholder={{ color: placeholderColor }}
                        />
                    </FormControl>
                </>
            )}

            <FormControl isRequired>
              <FormLabel color={headingColor}>E-mail</FormLabel>
              <Input 
                type="email" bg={inputBg} borderColor={borderColor} color={headingColor}
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" 
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel color={headingColor}>Senha</FormLabel>
              <Input 
                type="password" bg={inputBg} borderColor={borderColor} color={headingColor}
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" 
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>

            {!isLoginView && (
                <FormControl isRequired>
                    <FormLabel color={headingColor}>Confirmar Senha</FormLabel>
                    <Input 
                        type="password" bg={inputBg} borderColor={borderColor} color={headingColor}
                        value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="********" 
                        _placeholder={{ color: placeholderColor }}
                    />
                </FormControl>
            )}

            <Button
              bg={'blue.400'} color={'white'} _hover={{ bg: 'blue.500' }}
              width="full" type="submit" isLoading={isLoading} mt={4}
            >
              {isLoginView ? 'Entrar' : 'Cadastrar'}
            </Button>
          </VStack>
        </Box>

        <Box mt={6} textAlign="center">
            <Text fontSize="sm" color={textColor}>
                {isLoginView ? "Não tem uma conta? " : "Já possui conta? "}
                <ChakraLink color="blue.400" fontWeight="bold" onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? "Cadastre-se" : "Faça Login"}
                </ChakraLink>
            </Text>
        </Box>

      </Box>
    </Flex>
  );
}