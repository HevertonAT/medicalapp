import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function HematologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="red.400">
        Avaliação Hematológica
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Histórico de Sangramentos / Trombose</FormLabel>
        <Textarea 
          name="historico_sangramento" 
          value={formData.historico_sangramento || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Descreva episódios de hematomas, sangramentos gengivais, epistaxe ou eventos trombóticos prévios..."
          resize="none"
          minH="120px"
          _focus={{ borderColor: "red.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Avaliação de Linfonodos e Organomegalias</FormLabel>
        <Textarea 
          name="linfonodos" 
          value={formData.linfonodos || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Relate presença de linfonodomegalia (tamanho, consistência, dor), esplenomegalia ou hepatomegalia..." 
          resize="none"
          minH="140px"
          _focus={{ borderColor: "red.400" }}
        />
      </FormControl>
    </VStack>
  );
}