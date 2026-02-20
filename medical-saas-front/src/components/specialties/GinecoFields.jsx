import React, { useEffect } from "react";
import { 
  FormControl, FormLabel, Textarea, Input, VStack, Heading, SimpleGrid, HStack 
} from "@chakra-ui/react";

export default function GinecoFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  
  // Lógica de cálculo automático da DPP (Data Provável do Parto) baseada na DUM
  useEffect(() => {
    if (formData.dum && !formData.dpp) {
      try {
        const dumDate = new Date(formData.dum);
        // Soma 280 dias (40 semanas) à DUM
        const dppDate = new Date(dumDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        
        // Simula um evento para o handleChange padrão do sistema
        handleChange({
          target: { name: "dpp", value: dppDate.toISOString().slice(0, 10) }
        });
      } catch (e) {
        console.error("Erro ao calcular DPP:", e);
      }
    }
  }, [formData.dum, formData.dpp, handleChange]);

  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="pink.500">
        Avaliação Ginecológica e Obstétrica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Datas Críticas */}
        <FormControl isRequired>
          <FormLabel color={textColor} fontWeight="bold">DUM (Última Menstruação)</FormLabel>
          <Input 
            type="date" 
            name="dum" 
            value={formData.dum || ""} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">DPP (Data Provável do Parto)</FormLabel>
          <Input 
            type="date" 
            name="dpp" 
            value={formData.dpp || ""} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          />
        </FormControl>

        {/* Histórico Obstétrico Curto (GPA) */}
        <Box gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold" mb={3}>Histórico GPA</FormLabel>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel fontSize="xs" color={textColor}>Gesta (G)</FormLabel>
              <Input name="gesta" placeholder="0" value={formData.gesta || ""} onChange={handleChange} bg={bgInput} borderColor={borderColor} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" color={textColor}>Para (P)</FormLabel>
              <Input name="para" placeholder="0" value={formData.para || ""} onChange={handleChange} bg={bgInput} borderColor={borderColor} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" color={textColor}>Aborto (A)</FormLabel>
              <Input name="aborto" placeholder="0" value={formData.aborto || ""} onChange={handleChange} bg={bgInput} borderColor={borderColor} />
            </FormControl>
          </HStack>
        </Box>

        {/* Queixas e Exame Físico Específico */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Histórico e Exame Físico Ginecológico</FormLabel>
          <Textarea 
            name="gineco_exame" 
            value={formData.gineco_exame || ""} 
            onChange={handleChange} 
            placeholder="Descreva queixas (corrimentos, dor pélvica, irregularidade menstrual) e achados do exame especular/toque..."
            resize="none"
            minH="180px"
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}