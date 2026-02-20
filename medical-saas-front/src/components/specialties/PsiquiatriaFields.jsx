import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function PsiquiatriaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Exame do Estado Mental (EEM)</FormLabel>
        <Textarea name="exame_estado_mental" value={formData.exame_estado_mental || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Apresentação, afeto, pensamento, senso-percepção..." rows={3} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Padrão de Sono e Apetite</FormLabel>
        <Textarea name="sono_apetite" value={formData.sono_apetite || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Insônia (inicial/manutenção), hipersonia, perda de peso..." rows={2} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Ideação Suicida / Risco</FormLabel>
        <Textarea name="ideacao_suicida" value={formData.ideacao_suicida || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Nega ideação estruturada, plano, intenção..." rows={2} />
      </FormControl>
    </VStack>
  );
}