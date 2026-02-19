import { Box, Flex, Icon, Text, VStack, Button, Badge, useColorModeValue, IconButton, Tooltip } from '@chakra-ui/react';
// ADICIONEI: FaHeartbeat, FaFileMedical
import { FaHome, FaUserInjured, FaUserMd, FaCalendarAlt, FaSignOutAlt, FaChartPie, FaCode, FaBars, FaChevronLeft, FaChevronRight, FaHeartbeat, FaFileMedical } from 'react-icons/fa';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode"; 
import { ColorModeSwitcher } from './ColorModeSwitcher';

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado da Sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [simulatedRole, setSimulatedRole] = useState('');
  const [realRole, setRealRole] = useState('');

  // Cores Dark Mode
  const bgSidebar = useColorModeValue('white', 'gray.800');
  const bgMain = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const activeBg = useColorModeValue('blue.50', 'whiteAlpha.200');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const headingColor = useColorModeValue('blue.600', 'blue.200');

  useEffect(() => {
    const token = localStorage.getItem('medical_token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const trueRole = decoded.role || 'admin';
            setRealRole(trueRole);

            const savedRole = localStorage.getItem('user_role');
            setSimulatedRole(savedRole || trueRole);
        } catch (e) {
            console.error(e);
            setSimulatedRole('admin'); 
        }
    }
  }, []);

  // --- MENU AJUSTADO ---
  const menuItems = [
    // Menu Admin / Médico
    { name: 'Painel', icon: FaHome, path: '/dashboard', roles: ['superuser', 'admin', 'doctor'] },
    { name: 'Pacientes', icon: FaUserInjured, path: '/patients', roles: ['superuser', 'admin', 'doctor'] },
    { name: 'Profissionais', icon: FaUserMd, path: '/doctors', roles: ['superuser', 'admin'] },
    { name: 'Especialidades', icon: FaCode, path: '/specialties', roles: ['superuser', 'admin'] },
    // Removi 'patient' daqui pois ele terá o menu próprio abaixo
    { name: 'Agenda', icon: FaCalendarAlt, path: '/agenda', roles: ['superuser', 'admin', 'doctor'] }, 
    { name: 'Financeiro', icon: FaChartPie, path: '/financial', roles: ['superuser', 'admin'] },
    { name: 'Área Dev', icon: FaCode, path: '/dev-tools', roles: ['superuser'] },

    // Menu Exclusivo Paciente
    { name: 'Minha Saúde', icon: FaHeartbeat, path: '/minha-saude', roles: ['patient', 'paciente'] },
    { name: 'Meus Exames', icon: FaFileMedical, path: '/meus-exames', roles: ['patient', 'paciente'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem('medical_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  return (
    <Flex h="100vh" bg={bgMain}>
      {/* SIDEBAR COM LARGURA VARIÁVEL (250px ou 80px) */}
      <Box 
        w={isSidebarOpen ? "250px" : "80px"} 
        bg={bgSidebar} 
        shadow="md" 
        p={isSidebarOpen ? 5 : 2} // Menos padding se estiver fechado
        display={{ base: 'none', md: 'flex' }} 
        flexDirection="column"
        transition="width 0.3s ease" // Animação suave
        overflow="hidden"
        whiteSpace="nowrap"
        borderRight="1px solid"
        borderColor={useColorModeValue('gray.100', 'gray.700')}
      >
        
        {/* CABEÇALHO DA SIDEBAR */}
        <Flex 
            justify={isSidebarOpen ? "space-between" : "center"} 
            align="center" 
            mb={6} 
            direction={isSidebarOpen ? "row" : "column-reverse"} 
            gap={2}
        >
            {/* Título (some se fechado) */}
            {isSidebarOpen && (
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>
                  Medical
                </Text>
            )}
            
            {/* Botão de Toggle (Sempre visível) */}
            <IconButton 
                icon={isSidebarOpen ? <FaChevronLeft /> : <FaBars />} 
                size="sm" 
                variant="ghost" 
                aria-label="Alternar Menu"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            />
            
            {/* Dark Mode Switcher (Centralizado se fechado) */}
            <Box>
                <ColorModeSwitcher />
            </Box>
        </Flex>

        {/* BADGE DE CARGO */}
        <Flex justify="center" mb={8}>
            {isSidebarOpen ? (
                <Badge colorScheme={simulatedRole === 'superuser' ? 'purple' : simulatedRole === 'doctor' ? 'green' : simulatedRole === 'patient' || simulatedRole === 'paciente' ? 'orange' : 'blue'}>
                    {simulatedRole ? simulatedRole.toUpperCase() : '...'}
                </Badge>
            ) : (
                <Tooltip label={simulatedRole.toUpperCase()} placement="right">
                    <Box w={2} h={2} borderRadius="full" bg={simulatedRole === 'superuser' ? 'purple.400' : 'blue.400'} />
                </Tooltip>
            )}
        </Flex>
        
        {/* ITENS DO MENU */}
        <VStack spacing={2} align="stretch" flex="1">
          {menuItems.map((item) => {
            if (item.path === '/dev-tools') {
                if (realRole !== 'superuser') return null;
            } else if (!item.roles.includes(simulatedRole)) {
                return null;
            }

            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.name} label={!isSidebarOpen ? item.name : ''} placement="right">
                  <Link to={item.path}>
                    <Flex 
                      align="center" 
                      justify={isSidebarOpen ? "flex-start" : "center"} // Centraliza ícone se fechado
                      p={3} 
                      borderRadius="md" 
                      bg={isActive ? activeBg : 'transparent'} 
                      color={isActive ? activeColor : textColor}
                      _hover={{ bg: activeBg, color: activeColor }}
                      cursor="pointer"
                    >
                      <Icon as={item.icon} boxSize={5} mr={isSidebarOpen ? 3 : 0} />
                      
                      {/* Texto (some se fechado) */}
                      {isSidebarOpen && (
                          <Text fontWeight={isActive ? 'bold' : 'normal'}>{item.name}</Text>
                      )}
                    </Flex>
                  </Link>
              </Tooltip>
            );
          })}
        </VStack>

        {/* BOTÃO SAIR */}
        <Button 
          variant="outline" 
          colorScheme="red" 
          mt="auto"
          w="full"
          justifyContent={isSidebarOpen ? "flex-start" : "center"}
          leftIcon={isSidebarOpen ? <FaSignOutAlt /> : null}
          onClick={handleLogout}
        >
          {isSidebarOpen ? "Sair" : <Icon as={FaSignOutAlt} />}
        </Button>
      </Box>

      {/* CONTEÚDO PRINCIPAL (Se ajusta automaticamente) */}
      <Box flex="1" p={0} overflowY="auto" w="full">
        <Outlet />
      </Box>
    </Flex>
  );
}