import React from 'react';
import { 
  VStack, HStack, Checkbox, Input, Text, Heading, SimpleGrid, Box, Divider 
} from "@chakra-ui/react";

export default function AgendaConfigFields({ config, setConfig, textColor, bgInput, borderColor }) {
  const diasDaSemana = [
    { label: "Segunda-feira", value: "seg" },
    { label: "Terça-feira", value: "ter" },
    { label: "Quarta-feira", value: "qua" },
    { label: "Quinta-feira", value: "qui" },
    { label: "Sexta-feira", value: "sex" },
    { label: "Sábado", value: "sab" },
    { label: "Domingo", value: "dom" },
  ];

  const handleToggleDia = (dia) => {
    const novoDia = { ...config[dia], ativo: !config[dia]?.ativo };
    setConfig({ ...config, [dia]: novoDia });
  };

  const handleChangeHora = (dia, campo, valor) => {
    const novoDia = { ...config[dia], [campo]: valor };
    setConfig({ ...config, [dia]: novoDia });
  };

  return (
    <Box p={4} borderRadius="md" border="1px" borderColor={borderColor}>
      <VStack align="stretch" spacing={5}>
        <Heading size="xs" textTransform="uppercase" color="blue.400">
          Configuração de Disponibilidade (Agenda Base)
        </Heading>
        
        {diasDaSemana.map((dia) => (
          <SimpleGrid key={dia.value} columns={[1, 3]} spacing={4} alignItems="center">
            <Checkbox 
              colorScheme="blue" 
              isChecked={config[dia.value]?.ativo || false}
              onChange={() => handleToggleDia(dia.value)}
            >
              <Text color={textColor} fontWeight="medium" w="120px">{dia.label}</Text>
            </Checkbox>

            <HStack>
              <Text fontSize="xs" color={textColor}>Das:</Text>
              <Input 
                type="time" 
                size="sm" 
                bg={bgInput} 
                color={textColor}
                borderColor={borderColor}
                value={config[dia.value]?.inicio || "08:00"}
                onChange={(e) => handleChangeHora(dia.value, 'inicio', e.target.value)}
                isDisabled={!config[dia.value]?.ativo}
              />
            </HStack>

            <HStack>
              <Text fontSize="xs" color={textColor}>Até:</Text>
              <Input 
                type="time" 
                size="sm" 
                bg={bgInput} 
                color={textColor}
                borderColor={borderColor}
                value={config[dia.value]?.fim || "18:00"}
                onChange={(e) => handleChangeHora(dia.value, 'fim', e.target.value)}
                isDisabled={!config[dia.value]?.ativo}
              />
            </HStack>
          </SimpleGrid>
        ))}
        
        <Divider />
        
        <HStack justifyContent="space-between">
          <Text fontSize="sm" color={textColor} fontWeight="bold">Duração da Consulta:</Text>
          <Input 
            type="number" 
            w="100px" 
            size="sm" 
            bg={bgInput} 
            color={textColor}
            placeholder="Minutos"
            value={config.intervalo || 30}
            onChange={(e) => setConfig({ ...config, intervalo: e.target.value })}
          />
        </HStack>
      </VStack>
    </Box>
  );
}