import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack } from '@chakra-ui/react';

export default function PneumologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Carga Tabágica (Anos-maço)</FormLabel>
          <Input name="carga_tabagica" value={formData.carga_tabagica || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Ex: 20 anos-maço" />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Grau de Dispneia (mMRC)</FormLabel>
          <Input name="grau_dispneia" value={formData.grau_dispneia || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Escore de 0 a 4" />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Padrão de Tosse e Expectoração</FormLabel>
        <Textarea name="padrao_tosse" value={formData.padrao_tosse || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Seca, produtiva, coloração do escarro, hemoptise..." rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Ausculta Pulmonar</FormLabel>
        <Textarea name="ausculta_pulmonar" value={formData.ausculta_pulmonar || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Murmúrio vesicular presente? Sibilos, crepitações..." rows={2} />
      </FormControl>
    </VStack>
  );
}