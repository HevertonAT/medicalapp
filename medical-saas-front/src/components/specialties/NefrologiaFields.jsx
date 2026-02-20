import React from 'react';
import { FormControl, FormLabel, Textarea, Input, VStack, SimpleGrid } from '@chakra-ui/react';

export default function NefrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Padrão de Diurese</FormLabel>
          <Input name="diurese" value={formData.diurese || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Volume, cor, espuma, disúria..." />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Presença de Edema</FormLabel>
          <Input name="edema_nefro" value={formData.edema_nefro || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Membros inferiores, periorbital..." />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Histórico de Doença Renal / Litiase</FormLabel>
        <Textarea name="historico_renal" value={formData.historico_renal || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} rows={2} />
      </FormControl>
    </VStack>
  );
}