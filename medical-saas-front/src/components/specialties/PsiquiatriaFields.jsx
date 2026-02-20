import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function PsiquiatriaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="purple.400">
        Avaliação Psiquiátrica e Estado Mental
      </Heading>

      {/* Exame do Estado Mental - Campo Principal e Amplo */}
      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Exame do Estado Mental (EEM)</FormLabel>
        <Textarea 
          name="exame_estado_mental" 
          value={formData.exame_estado_mental || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Descreva minuciosamente: aparência, atitude, consciência, orientação, atenção, memória, inteligência, afeto, pensamento (curso, forma e conteúdo), senso-percepção e juízo crítico..." 
          resize="none"
          minH="250px"  // <-- TAMANHO AMPLIADO PARA EEM DETALHADO
          _focus={{ borderColor: "purple.400" }}
        />
      </FormControl>

      {/* Padrão de Sono e Apetite */}
      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Padrão de Sono e Apetite</FormLabel>
        <Textarea 
          name="sono_apetite" 
          value={formData.sono_apetite || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Registre insônia inicial, intermediária ou terminal, hipersonia, apetite, variações de peso e hábitos alimentares..." 
          resize="none"
          minH="120px"
          _focus={{ borderColor: "purple.400" }}
        />
      </FormControl>

      {/* Ideação Suicida / Risco - Campo de Destaque */}
      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Ideação Suicida / Avaliação de Risco</FormLabel>
        <Textarea 
          name="ideacao_suicida" 
          value={formData.ideacao_suicida || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Avalie presença de ideação (passiva/ativa), planos estruturados, intenção, histórico de tentativas e fatores de proteção..." 
          resize="none"
          minH="120px"
          _focus={{ borderColor: "red.400" }} // Destaque em vermelho para campo crítico
        />
      </FormControl>
    </VStack>
  );
}