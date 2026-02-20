import React from 'react';
import { FormControl, FormLabel, Textarea, Input, VStack, SimpleGrid } from '@chakra-ui/react';

export default function InfectologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Data de Início da Febre</FormLabel>
          <Input type="date" name="inicio_febre" value={formData.inicio_febre || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Uso Recente de Antibióticos</FormLabel>
          <Input name="uso_antibioticos" value={formData.uso_antibioticos || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Qual e por quantos dias?" />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Foco Infeccioso e Sintomas Específicos</FormLabel>
        <Textarea name="foco_infeccioso" value={formData.foco_infeccioso || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Lesões cutâneas, tosse, disúria, viagens recentes..." rows={3} />
      </FormControl>
    </VStack>
  );
}