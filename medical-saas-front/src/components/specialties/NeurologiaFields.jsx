import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function NeurologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Nível de Consciência e Cognição</FormLabel>
        <Textarea name="nivel_consciencia" value={formData.nivel_consciencia || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Glasgow, orientação tempo/espaço..." rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Exame Neurológico Motor e Sensitivo</FormLabel>
        <Textarea name="exame_neuro" value={formData.exame_neuro || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Força motora, reflexos, sensibilidade, pares cranianos..." rows={3} />
      </FormControl>
    </VStack>
  );
}