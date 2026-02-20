import React from 'react';
import { FormControl, FormLabel, Textarea, Input, VStack, SimpleGrid, Heading } from '@chakra-ui/react';

export default function NefrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="blue.500">
        Avaliação Nefrológica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Padrão de Diurese</FormLabel>
          <Input 
            name="diurese" 
            value={formData.diurese || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Volume, cor, espuma, disúria..." 
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Presença de Edema</FormLabel>
          <Input 
            name="edema_nefro" 
            value={formData.edema_nefro || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Membros inferiores, periorbital..." 
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>

        {/* Histórico Renal - Campo Amplo */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Histórico de Doença Renal / Litíase</FormLabel>
          <Textarea 
            name="historico_renal" 
            value={formData.historico_renal || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Descreva histórico de infecções urinárias, cálculos renais, hipertensão arterial, diabetes ou tratamentos dialíticos prévios..."
            resize="none"
            minH="150px"
            _focus={{ borderColor: "blue.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}