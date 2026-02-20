import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function ReumatologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="blue.600">
        Avaliação Reumatológica e Articular
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Padrão da Dor Articular</FormLabel>
        <Textarea 
          name="dor_articular" 
          value={formData.dor_articular || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Descreva se a dor é Mecânica ou Inflamatória, mapeie as articulações acometidas, intensidade, ritmo e fatores de alívio..." 
          resize="none"
          minH="160px"  // <-- TAMANHO AMPLIADO PARA DESCRIÇÃO DETALHADA DA DOR
          _focus={{ borderColor: "blue.500" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Rigidez Matinal e Edema Articular</FormLabel>
        <Textarea 
          name="rigidez_edema" 
          value={formData.rigidez_edema || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Duração da rigidez matinal em minutos/horas, presença de sinais logísticos, sinovite e distribuição do edema..." 
          resize="none"
          minH="120px"
          _focus={{ borderColor: "blue.500" }}
        />
      </FormControl>
    </VStack>
  );
}