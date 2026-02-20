import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function GastroenterologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Ritmo Intestinal e Aspecto das Fezes</FormLabel>
        <Textarea name="ritmo_intestinal" value={formData.ritmo_intestinal || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Escala de Bristol, frequência, presença de sangue/muco..." rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Sintomas Dis pépticos / Dor Abdominal</FormLabel>
        <Textarea name="dor_abdominal" value={formData.dor_abdominal || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Localização, irradiação, fatores de melhora/piora, azia..." rows={2} />
      </FormControl>
    </VStack>
  );
}