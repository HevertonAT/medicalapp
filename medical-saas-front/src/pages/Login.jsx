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
  // Estado para alternar entre Login e Cadastro
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [role, setRole] = useState('patient'); // Padrão: Paciente

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

  // --- AÇÃO DE LOGIN (COM REDIRECIONAMENTO INTELIGENTE) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("1. Iniciando Login...");
      
      const params = new URLSearchParams();
      params.append('username', email); 
      params.append('password', password);

      // 2. USO DA VARIÁVEL API_BASE (Ajuste Feito)
      const response = await axios.post(
        `${API_BASE}/auth/login`, 
        params,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
      );

      console.log("2. Sucesso!", response.data);
      
      // Salva o token
      const token = response.data.access_token;
      // Captura a role vinda do backend
      const userRole = response.data.role;

      localStorage.setItem('medical_token', token);
      
      if (userRole) {
          localStorage.setItem('user_role', userRole);
      }

      toast({ title: 'Bem-vindo(a)!', status: 'success', duration: 2000, isClosable: true });
      
      // --- ROTA INTELIGENTE ---
      // Se for paciente, vai para a área exclusiva. Se for médico/admin, vai para o dashboard.
      if (userRole === 'patient' || userRole === 'paciente') {
          navigate("/minha-saude"); 
      } else {
          navigate("/dashboard");
      }
      
    } catch (error) {
      console.error("3. Erro detectado:", error);
      let mensagem = "Erro ao conectar.";
      
      if (error.response) {
        if (error.response.status === 401) {
             mensagem = "E-mail ou senha incorretos.";
        } else if (error.response.status === 422) {
             mensagem = "Formato de dados inválido (Erro 422).";
        } else {
             mensagem = "Erro no servidor: " + error.response.status;
        }
      } else if (error.code === "ERR_NETWORK") {
        mensagem = "Não foi possível conectar ao Backend. Verifique se o terminal preto está rodando.";
      }
      
      toast({ title: 'Falha no login', description: mensagem, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // --- AÇÃO DE CADASTRO (MANTIDA) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPass) {
        toast({ title: 'Senhas não conferem', status: 'warning', duration: 3000 });
        return;
    }

    setIsLoading(true);
    try {
        // 3. USO DA VARIÁVEL API_BASE NO CADASTRO (Ajuste Feito)
        await axios.post(`${API_BASE}/auth/register`, {
            full_name: name,
            email: email,
            password: password,
            role: role
        });

        toast({ 
            title: 'Conta criada com sucesso!', 
            description: "Faça login para acessar o sistema.", 
            status: 'success', 
            duration: 4000 
        });
        
        setIsLoginView(true); // Volta para tela de login
        setPassword('');
        setConfirmPass('');

    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.detail || "Erro ao criar conta. Tente novamente.";
        toast({ title: 'Erro no cadastro', description: msg, status: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={bgPage} position="relative">
      
      <Box position="absolute" top={4} right={4}>
        <ColorModeSwitcher />
      </Box>

      <Box rounded={'lg'} bg={bgCard} boxShadow={'lg'} p={8} width={['90%', '400px']}>
        <VStack spacing={4}>
          <Heading fontSize={'2xl'} color={headingColor}>
            {isLoginView ? 'Acesso à Clínica' : 'Crie sua Conta'}
          </Heading>
          <Text fontSize={'md'} color={textColor}>
            {isLoginView ? 'Entre para gerenciar seus pacientes ✌️' : 'Preencha seus dados para começar.'}
          </Text>
        </VStack>

        <Box as="form" mt={8} onSubmit={isLoginView ? handleLogin : handleRegister}>
          <VStack spacing={4}>
            
            {/* Campo Nome (Apenas no Cadastro) */}
            {!isLoginView && (
                <FormControl isRequired>
                    <FormLabel color={headingColor}>Nome Completo</FormLabel>
                    <Input 
                        type="text" 
                        bg={inputBg}
                        borderColor={borderColor}
                        color={headingColor}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome" 
                    />
                </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel color={headingColor}>E-mail</FormLabel>
              <Input 
                type="email" 
                bg={inputBg}
                borderColor={borderColor}
                color={headingColor}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" 
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel color={headingColor}>Senha</FormLabel>
              <Input 
                type="password" 
                bg={inputBg}
                borderColor={borderColor}
                color={headingColor}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********" 
              />
            </FormControl>

            {/* Campos Extras de Cadastro */}
            {!isLoginView && (
                <>
                    <FormControl isRequired>
                        <FormLabel color={headingColor}>Confirmar Senha</FormLabel>
                        <Input 
                            type="password" 
                            bg={inputBg}
                            borderColor={borderColor}
                            color={headingColor}
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            placeholder="********" 
                        />
                    </FormControl>
                </>
            )}

            <Button
              bg={'blue.400'}
              color={'white'}
              _hover={{ bg: 'blue.500' }}
              width="full"
              type="submit"
              isLoading={isLoading}
              mt={2}
            >
              {isLoginView ? 'Entrar' : 'Cadastrar'}
            </Button>
          </VStack>
        </Box>

        {/* Link para Alternar Telas */}
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