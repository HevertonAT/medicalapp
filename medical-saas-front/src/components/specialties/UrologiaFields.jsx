import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack } from '@chakra-ui/react';

export default function UrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Rastreio PSA / Próstata</FormLabel>
          <Input name="rastreio_psa" value={formData.rastreio_psa || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Último valor e data..." />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Função Sexual</FormLabel>
          <Input name="funcao_sexual" value={formData.funcao_sexual || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Disfunção erétil, libido..." />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Sintomas do Trato Urinário Inferior (LUTS)</FormLabel>
        <Textarea name="sintomas_luts" value={formData.sintomas_luts || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Jato fraco, noctúria, urgência, incontinência..." rows={2} />
      </FormControl>
    </VStack>
  );
}