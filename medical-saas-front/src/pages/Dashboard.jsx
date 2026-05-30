import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Flex, Heading, Text, Icon, 
  SimpleGrid, useColorModeValue, Spinner
} from '@chakra-ui/react';
import { FaUserInjured, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { STATUS_AGENDAMENTO, STATUS_COLORS, STATUS_LABELS } from '../theme/constants';

// --- IMPORTAÇÕES DO CALENDÁRIO GRID ---
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Dashboard() {
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const headingColor = useColorModeValue('gray.700', 'white');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.500');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // Visão Mensal como padrão
  
  const [stats, setStats] = useState({
    total_patients: 0,
    appointments_count: 0,
    appointments_list: [] 
  });
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Função para garantir formato ISO local
  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDashboardData = useCallback(async (targetDate, view) => {
    try {
      setLoading(true);
      
      // Vamos buscar o período do mês atual daquela navegação, para garantir que os dados estejam carregados se ele trocar pra semana/mês
      // Isso simplifica a lógica: a cada mudança de mês/data, pegamos o range customizado.
      let start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      let end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      const startStr = formatLocalDate(start);
      const endStr = formatLocalDate(end);

      const response = await api.get(`/dashboard/?period=custom&start_date=${startStr}&end_date=${endStr}`);
      setStats(response.data);
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(currentDate, currentView);
  }, [fetchDashboardData, currentDate, currentView]);

  // Transformando os atendimentos retornados no formato do Calendário
  const calendarEvents = stats.appointments_list.map((app) => {
    const startDate = new Date(app.data_horario);
    const endDate = new Date(startDate.getTime() + 40 * 60000); // Estimativa de 40min para exibição na Dashboard

    return {
      id: app.id,
      title: app.patient_name,
      start: startDate,
      end: endDate,
      resource: app, 
    };
  });

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    let backgroundColor = STATUS_COLORS[status] || STATUS_COLORS[STATUS_AGENDAMENTO.AGENDADO];

    return {
      style: {
        backgroundColor,
        color: 'white',
        border: 'none',
        display: 'block',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        opacity: status === STATUS_AGENDAMENTO.CANCELADO ? 0.6 : 1
      }
    };
  };

  const calendarStyles = {
    '.rbc-calendar': { fontFamily: 'inherit', color: textColor, minHeight: '650px' },
    '.rbc-header': { bg: headerBg, borderColor: borderColor, color: textColor, py: 2, fontWeight: 'bold' },
    '.rbc-time-view': { borderColor: borderColor, bg: bgCard, borderRadius: 'md', overflow: 'hidden' },
    '.rbc-time-header': { bg: headerBg, color: textColor },
    '.rbc-time-content': { borderTopColor: borderColor },
    '.rbc-timeslot-group': { borderColor: borderColor },
    '.rbc-day-bg': { borderColor: borderColor },
    '.rbc-day-slot .rbc-time-slot': { borderColor: borderColor },
    '.rbc-time-gutter .rbc-timeslot-group': { borderColor: borderColor, bg: headerBg },
    '.rbc-label': { color: textColor, px: 2 },
    '.rbc-event': { border: 'none', padding: '4px', borderRadius: '4px' },
    '.rbc-today': { bg: useColorModeValue('blue.50', 'gray.700') },
    '.rbc-allday-cell': { display: 'none' },
    '.rbc-time-header-content': { borderLeftColor: borderColor },
    '.rbc-toolbar': { mb: 4, color: textColor },
    '.rbc-btn-group button': {
         color: textColor,
         borderColor: borderColor,
         bg: bgCard,
         _hover: { bg: headerBg },
         _active: { bg: useColorModeValue('gray.200', 'gray.600'), boxShadow: 'none' }
    },
    '.rbc-toolbar button.rbc-active': { bg: useColorModeValue('gray.200', 'gray.600'), color: textColor },
    '.rbc-off-range-bg': { background: useColorModeValue('gray.100', 'gray.900') },
    '.rbc-off-range .rbc-button-link': { color: mutedTextColor },
  };

  return (
    <Box p={8}>
      <Heading size="lg" color={headingColor} mb={6}>Visão Geral</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        <Box bg={bgCard} p={6} borderRadius="lg" shadow="md" borderLeft="4px solid" borderColor="blue.400">
          <Text color="gray.500" fontSize="sm">Pacientes Totais</Text>
          <Flex justify="space-between" align="center" mt={2}>
            <Heading size="lg" color={headingColor}>{stats.total_patients}</Heading>
            <Icon as={FaUserInjured} w={8} h={8} color="blue.200" />
          </Flex>
        </Box>

        <Box bg={bgCard} p={6} borderRadius="lg" shadow="md" borderLeft="4px solid" borderColor="cyan.400">
          <Text color="gray.500" fontSize="sm">Consultas Agendadas no Mês</Text>
          <Flex justify="space-between" align="center" mt={2}>
            <Heading size="lg" color={headingColor}>{stats.appointments_count}</Heading>
            <Icon as={FaCalendarAlt} w={8} h={8} color="cyan.200" />
          </Flex>
        </Box>
      </SimpleGrid>

      <Box sx={calendarStyles} p={4} bg={bgCard} shadow="md" borderRadius="lg" border="1px solid" borderColor={borderColor}>
        {loading && stats.appointments_list.length === 0 ? (
          <Flex justify="center" align="center" h="400px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            
            view={currentView}
            onView={(newView) => setCurrentView(newView)}
            views={['day', 'work_week', 'month']}
            
            step={30} 
            timeslots={1}
            min={new Date(2024, 0, 1, 0, 0)}
            max={new Date(2024, 0, 1, 23, 59)}
            culture="pt-BR"
            eventPropGetter={eventStyleGetter}
            
            components={{
                event: ({ event }) => {
                    const app = event.resource;
                    return (
                        <Box p={1} h="100%" display="flex" flexDirection="column" justifyContent="space-between">
                            <Box>
                                <Text fontWeight="bold" fontSize="xs" isTruncated>{app.patient_name}</Text>
                                {currentView !== 'month' && (
                                    <Text fontSize="2xs" isTruncated>{app.doctor_name}</Text>
                                )}
                                <Text fontSize="2xs" fontWeight="extrabold">{STATUS_LABELS[app.status] || ''}</Text>
                            </Box>
                        </Box>
                    );
                }
            }}
            messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana Útil",
                work_week: "Semana",
                day: "Dia",
                noEventsInRange: "Não há atendimentos para este dia.",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
