import React from "react";
import { 
  FormControl, FormLabel, Input, VStack, Heading, SimpleGrid, Textarea 
} from "@chakra-ui/react";

export default function PediatriaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="blue.400">
        Avaliação Pediátrica e Puericultura
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* CPF do Responsável */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">CPF do Responsável</FormLabel>
          <Input 
            name="responsible_cpf" 
            value={formData.responsible_cpf || ""} 
            onChange={handleChange} 
            placeholder="000.000.000-00" 
            bg={bgInput} 
            color={textColor} 
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        {/* Dados Antropométricos e de Nascimento */}
        <FormControl>
          <FormLabel color={textColor} fontSize="sm">Peso (kg/g)</FormLabel>
          <Input 
            name="peso" 
            value={formData.peso || ""} 
            onChange={handleChange} 
            placeholder="Ex: 3.500" 
            bg={bgInput} 
            color={textColor} 
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontSize="sm">Apgar (1'/5')</FormLabel>
          <Input 
            name="apgar" 
            value={formData.apgar || ""} 
            onChange={handleChange} 
            placeholder="Ex: 9/10" 
            bg={bgInput} 
            color={textColor} 
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontSize="sm">Perímetro Cefálico (cm)</FormLabel>
          <Input 
            name="perimetro_cefalico" 
            value={formData.perimetro_cefalico || ""} 
            onChange={handleChange} 
            placeholder="Ex: 35" 
            bg={bgInput} 
            color={textColor} 
            borderColor={borderColor}
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        {/* Desenvolvimento e Observações - Campo Amplo */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Desenvolvimento Neuropsicomotor e Observações</FormLabel>
          <Textarea 
            name="ped_observations" 
            value={formData.ped_observations || ""} 
            onChange={handleChange} 
            placeholder="Relate marcos do desenvolvimento (sustentação cefálica, rolar, sentar), alimentação, vacinação e queixas da família..."
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            resize="none"
            minH="180px"  // <-- TAMANHO AMPLIADO PARA RELATOS DE PUERICULTURA
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}