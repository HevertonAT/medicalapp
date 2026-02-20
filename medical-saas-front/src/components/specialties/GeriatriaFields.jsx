import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack, Heading } from '@chakra-ui/react';

export default function GeriatriaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="cyan.500">
        Avaliação Geriátrica Ampla
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Risco de Quedas</FormLabel>
          <Input 
            name="risco_quedas" 
            value={formData.risco_quedas || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Histórico no último ano, uso de auxílio..." 
            _focus={{ borderColor: "cyan.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Cognição (Mini-Mental/Relógio)</FormLabel>
          <Input 
            name="cognicao_escore" 
            value={formData.cognicao_escore || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Pontuação total ou observações..." 
            _focus={{ borderColor: "cyan.400" }}
          />
        </FormControl>

        {/* Avaliação Funcional (AGA) */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Funcionalidade e Autonomia (AVDs e AIVDs)</FormLabel>
          <Textarea 
            name="aga_funcionalidade" 
            value={formData.aga_funcionalidade || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Descreva a independência para atividades diárias, continência, humor e suporte social..." 
            resize="none" // <-- REMOVE A REGULAGEM MANUAL
            minH="180px"  // <-- TAMANHO AMPLIADO PARA AGA
            _focus={{ borderColor: "cyan.400" }}
          />
        </FormControl>

        {/* Polifarmácia */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Polifarmácia (Medicamentos em uso)</FormLabel>
          <Textarea 
            name="polifarmacia" 
            value={formData.polifarmacia || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Liste todos os medicamentos, dosagens e horários. Atenção a interações medicamentosas..." 
            resize="none"
            minH="120px"
            _focus={{ borderColor: "cyan.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}