import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function ReumatologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Padrão da Dor Articular</FormLabel>
        <Textarea name="dor_articular" value={formData.dor_articular || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Mecânica x Inflamatória, articulações acometidas, intensidade..." rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Rigidez Matinal e Edema Articular</FormLabel>
        <Textarea name="rigidez_edema" value={formData.rigidez_edema || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Duração da rigidez matinal, presença de sinovite..." rows={2} />
      </FormControl>
    </VStack>
  );
}