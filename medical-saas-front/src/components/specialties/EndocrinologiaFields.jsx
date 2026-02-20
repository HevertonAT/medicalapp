import React from 'react';
import { FormControl, FormLabel, Textarea, Input, SimpleGrid, VStack, Heading } from '@chakra-ui/react';

export default function EndocrinologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção para organização no Prontuário */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="purple.400">
        Avaliação Endocrinológica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Glicemia Capilar (mg/dL)</FormLabel>
          <Input 
            name="glicemia_capilar" 
            value={formData.glicemia_capilar || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Ex: 99"
            _focus={{ borderColor: "purple.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Alteração de Peso (kg)</FormLabel>
          <Input 
            name="alteracao_peso" 
            value={formData.alteracao_peso || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Ex: Perdeu 5kg em 2 meses" 
            _focus={{ borderColor: "purple.400" }}
          />
        </FormControl>

        {/* Campo de Texto para Sintomas Metabólicos */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Sintomas Metabólicos / Tireoidianos</FormLabel>
          <Textarea 
            name="sintomas_metabolicos" 
            value={formData.sintomas_metabolicos || ''} 
            onChange={handleChange} 
            placeholder="Relate polidipsia, poliúria, intolerância ao frio/calor, tremores, palpitações..."
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            resize="none"
            minH="150px"
            _focus={{ borderColor: "purple.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}