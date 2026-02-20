import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack, Heading } from '@chakra-ui/react';

export default function PneumologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="cyan.600">
        Avaliação Respiratória e Pulmonar
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Dados Objetivos */}
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Carga Tabágica (Anos-maço)</FormLabel>
          <Input 
            name="carga_tabagica" 
            value={formData.carga_tabagica || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Ex: 20 anos-maço" 
            _focus={{ borderColor: "cyan.500" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Grau de Dispneia (mMRC)</FormLabel>
          <Input 
            name="grau_dispneia" 
            value={formData.grau_dispneia || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Escore de 0 a 4" 
            _focus={{ borderColor: "cyan.500" }}
          />
        </FormControl>

        {/* Padrão de Tosse - Tamanho Confortável */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Padrão de Tosse e Expectoração</FormLabel>
          <Textarea 
            name="padrao_tosse" 
            value={formData.padrao_tosse || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Descreva se seca, produtiva, frequência, coloração do escarro, presença de hemoptise e fatores desencadeantes..." 
            resize="none"
            minH="120px"
            _focus={{ borderColor: "cyan.500" }}
          />
        </FormControl>

        {/* Ausculta Pulmonar - Tamanho Confortável */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Ausculta Pulmonar Detalhada</FormLabel>
          <Textarea 
            name="ausculta_pulmonar" 
            value={formData.ausculta_pulmonar || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Murmúrio vesicular (presente/diminuído), presença de ruídos adventícios (sibilos, crepitações, roncos) e localização..." 
            resize="none"
            minH="120px"
            _focus={{ borderColor: "cyan.500" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}