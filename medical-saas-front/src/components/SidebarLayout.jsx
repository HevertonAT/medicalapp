import { 
  Box, Flex, Icon, Text, VStack, Button, Badge, useColorModeValue, IconButton, Tooltip, Image,
  Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure 
} from '@chakra-ui/react';
import { 
  FaHome, FaUserInjured, FaUserMd, FaCalendarAlt, FaSignOutAlt, 
  FaChartPie, FaCode, FaBars, FaChevronLeft, FaChevronRight, 
  FaHeartbeat, FaFileMedical, FaClock, FaBuilding, FaFileInvoiceDollar, FaUserTie
} from 'react-icons/fa';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode"; 
import { ColorModeSwitcher } from './ColorModeSwitcher';

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- Controle do Menu Mobile (Drawer) ---
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Estado da Sidebar Desktop
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

  const menuItems = [
    { name: 'Painel', icon: FaHome, path: '/dashboard', roles: ['admin', 'doctor'] },
    { name: 'Cadastro de Clinicas', icon: FaBuilding, path: '/clinicas', roles: ['superuser'] },
    { name: 'Pacientes', icon: FaUserInjured, path: '/patients', roles: ['admin', 'doctor', 'recepcionista'] },
    { name: 'Agenda', icon: FaCalendarAlt, path: '/agenda', roles: ['superuser', 'admin', 'doctor', 'recepcionista'] }, 
    { name: 'Configurações', icon: FaClock, path: '/minha-agenda', roles: ['doctor', 'admin'] },
    { name: 'Profissionais', icon: FaUserMd, path: '/doctors', roles: ['superuser', 'admin'] },
    { name: 'Especialidades', icon: FaCode, path: '/specialties', roles: ['superuser', 'admin'] },
    { name: 'Dashboard Caixa', icon: FaChartPie, path: '/financial', roles: ['admin'] },
    { name: 'Contas (Pagar/Receber)', icon: FaFileInvoiceDollar, path: '/contas', roles: ['admin'] }, 
    { name: 'Painel SaaS', icon: FaBuilding, path: '/saas', roles: ['superuser'] },
    { name: 'Área Dev', icon: FaCode, path: '/dev-tools', roles: ['superuser'] },
    { name: 'Minha Equipe', icon: FaUserTie, path: '/equipe', roles: ['admin', 'superuser'] },
    { name: 'Minha Saúde', icon: FaHeartbeat, path: '/minha-saude', roles: ['patient', 'paciente'] },
    { name: 'Meus Exames', icon: FaFileMedical, path: '/meus-exames', roles: ['patient', 'paciente'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem('medical_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const getBadgeColor = (role) => {
      if (role === 'superuser') return 'purple';
      if (role === 'doctor') return 'green';
      if (role === 'recepcionista') return 'pink'; 
      if (role === 'patient' || role === 'paciente') return 'orange';
      return 'blue'; 
  };

  return (
    // Adicionado direction para organizar a barra mobile em cima do conteúdo
    <Flex h="100vh" bg={bgMain} direction={{ base: 'column', md: 'row' }}>
      
      {/* ==========================================
          BARRA SUPERIOR MOBILE
          Só aparece no celular (base: 'flex', md: 'none')
      ========================================== */}
      <Flex 
        display={{ base: 'flex', md: 'none' }} 
        w="full" p={4} align="center" justify="space-between" 
        bg={bgSidebar} borderBottom="1px solid" borderColor={useColorModeValue('gray.100', 'gray.700')}
        shadow="sm"
      >
        <Flex align="center" gap={2}>
            <Image src="/icon-512.png" alt="VezzCare Logo" boxSize="32px" borderRadius="md" />
            <Text fontSize="xl" fontWeight="bold" color={headingColor}>VezzCare</Text>
        </Flex>
        <Flex align="center" gap={2}>
            <ColorModeSwitcher />
            <IconButton icon={<FaBars />} variant="outline" onClick={onOpen} aria-label="Abrir Menu" />
        </Flex>
      </Flex>

      {/* ==========================================
          MENU GAVETA MOBILE (Desliza da esquerda)
      ========================================== */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={bgSidebar}>
          <DrawerCloseButton mt={2} />
          <DrawerBody p={5} display="flex" flexDirection="column">
            
            <Flex align="center" gap={2} mb={6} mt={2}>
                <Image src="/icon-512.png" alt="VezzCare Logo" boxSize="32px" borderRadius="md" />
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>VezzCare</Text>
            </Flex>

            <Flex justify="center" mb={6}>
                <Badge colorScheme={getBadgeColor(simulatedRole)}>
                    {simulatedRole ? simulatedRole.toUpperCase() : '...'}
                </Badge>
            </Flex>
            
            <VStack spacing={2} align="stretch" flex="1" overflowY="auto">
              {menuItems.map((item) => {
                if (item.path === '/dev-tools' && realRole !== 'superuser') return null;
                if (!item.roles.includes(simulatedRole)) return null;

                const isActive = location.pathname === item.path;
                return (
                  // onClick={onClose} faz o menu fechar automaticamente ao clicar no link
                  <Link to={item.path} key={item.name} onClick={onClose}>
                    <Flex 
                      align="center" p={3} borderRadius="md" 
                      bg={isActive ? activeBg : 'transparent'} 
                      color={isActive ? activeColor : textColor}
                      _hover={{ bg: activeBg, color: activeColor }}
                    >
                      <Icon as={item.icon} boxSize={5} mr={3} />
                      <Text fontWeight={isActive ? 'bold' : 'normal'} fontSize="sm">{item.name}</Text>
                    </Flex>
                  </Link>
                );
              })}
            </VStack>

            <Button 
              variant="outline" colorScheme="red" mt={8} w="full" 
              justifyContent="flex-start" leftIcon={<FaSignOutAlt />} onClick={handleLogout}
            >
              Sair
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      <Box 
        w={isSidebarOpen ? "250px" : "80px"} 
        bg={bgSidebar} 
        shadow="md" 
        p={isSidebarOpen ? 5 : 2} 
        display={{ base: 'none', md: 'flex' }} 
        flexDirection="column"
        transition="width 0.3s ease"
        overflow="hidden"
        whiteSpace="nowrap"
        borderRight="1px solid"
        borderColor={useColorModeValue('gray.100', 'gray.700')}
      >
        <Flex justify={isSidebarOpen ? "space-between" : "center"} align="center" mb={6} direction={isSidebarOpen ? "row" : "column-reverse"} gap={2}>
            {isSidebarOpen ? (
                <Flex align="center" gap={2}>
                    <Image src="/icon-512.png" alt="VezzCare Logo" boxSize="32px" borderRadius="md" />
                    <Text fontSize="xl" fontWeight="bold" color={headingColor}>VezzCare</Text>
                </Flex>
            ) : (
                <Image src="/icon-512.png" alt="VezzCare Logo" boxSize="32px" borderRadius="md" />
            )}
            
            <IconButton 
                icon={isSidebarOpen ? <FaChevronLeft /> : <FaBars />} 
                size="sm" 
                variant="ghost" 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            />
            
            <Box><ColorModeSwitcher /></Box>
        </Flex>

        <Flex justify="center" mb={8}>
            {isSidebarOpen ? (
                <Badge colorScheme={getBadgeColor(simulatedRole)}>
                    {simulatedRole ? simulatedRole.toUpperCase() : '...'}
                </Badge>
            ) : (
                <Tooltip label={simulatedRole.toUpperCase()} placement="right">
                    <Box w={2} h={2} borderRadius="full" bg={`${getBadgeColor(simulatedRole)}.400`} />
                </Tooltip>
            )}
        </Flex>
        
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
                      justify={isSidebarOpen ? "flex-start" : "center"} 
                      p={3} 
                      borderRadius="md" 
                      bg={isActive ? activeBg : 'transparent'} 
                      color={isActive ? activeColor : textColor}
                      _hover={{ bg: activeBg, color: activeColor }}
                      cursor="pointer"
                    >
                      <Icon as={item.icon} boxSize={5} mr={isSidebarOpen ? 3 : 0} />
                      {isSidebarOpen && (
                          <Text fontWeight={isActive ? 'bold' : 'normal'} fontSize="sm">{item.name}</Text>
                      )}
                    </Flex>
                  </Link>
              </Tooltip>
            );
          })}
        </VStack>

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

      {/* ==========================================
          CONTEÚDO PRINCIPAL (TELAS)
      ========================================== */}
      <Box flex="1" p={0} overflowY="auto" w="full">
        <Outlet />
      </Box>
    </Flex>
  );
}