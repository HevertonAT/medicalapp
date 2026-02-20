import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack, Heading } from '@chakra-ui/react';

export default function UrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção para organização visual */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="blue.700">
        Avaliação Urológica e Trato Urinário
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Dados de Rastreio */}
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Rastreio PSA / Próstata</FormLabel>
          <Input 
            name="rastreio_psa" 
            value={formData.rastreio_psa || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Último valor, data e achados de toque..." 
            _focus={{ borderColor: "blue.500" }}
          />
        </FormControl>

        {/* Função Sexual */}
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Função Sexual</FormLabel>
          <Input 
            name="funcao_sexual" 
            value={formData.funcao_sexual || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Disfunção erétil, libido, queixas associadas..." 
            _focus={{ borderColor: "blue.500" }}
          />
        </FormControl>

        {/* Sintomas LUTS - Campo Amplo */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Sintomas do Trato Urinário Inferior (LUTS)</FormLabel>
          <Textarea 
            name="sintomas_luts" 
            value={formData.sintomas_luts || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Descreva detalhadamente: jato fraco, hesitação, noctúria, polaciúria, urgência ou incontinência..." 
            resize="none"
            minH="150px"
            _focus={{ borderColor: "blue.500" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}