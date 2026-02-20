import React from "react";
import { FormControl, FormLabel, Textarea, Select, VStack, Heading, SimpleGrid } from "@chakra-ui/react";

export default function DermatologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="pink.400">
        Avaliação Dermatológica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        {/* Seleção de Fototipo */}
        <FormControl isRequired>
          <FormLabel color={textColor} fontWeight="bold">Fototipo (Escala de Fitzpatrick)</FormLabel>
          <Select 
            name="fototipo" 
            value={formData.fototipo || ""} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          >
            <option value="">Selecione o Fototipo</option>
            <option value="I">Tipo I: Pele muito clara (sempre queima)</option>
            <option value="II">Tipo II: Pele clara (queima fácil)</option>
            <option value="III">Tipo III: Pele morena clara (queima moderadamente)</option>
            <option value="IV">Tipo IV: Pele morena moderada (queima pouco)</option>
            <option value="V">Tipo V: Pele morena escura (raramente queima)</option>
            <option value="VI">Tipo VI: Pele negra (nunca queima)</option>
          </Select>
        </FormControl>

        {/* Queixas e Lesões Atuais */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Queixas e Lesões Atuais</FormLabel>
          <Textarea 
            name="derma_queixas" 
            value={formData.derma_queixas || ""} 
            onChange={handleChange} 
            placeholder="Descreva as lesões: localização, tempo de evolução, sintomas associados (prurido, dor)..."
            resize="none"
            minH="120px"
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          />
        </FormControl>

        {/* Mapeamento Corporal Detalhado */}
        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Mapeamento Corporal e Observações</FormLabel>
          <Textarea 
            name="body_map" 
            value={formData.body_map || ""} 
            onChange={handleChange} 
            placeholder="Descreva nevos, manchas ou áreas de interesse para acompanhamento..."
            resize="none" 
            minH="150px"  // <-- MAIOR ESPAÇO PARA MAPEAMENTO
            bg={bgInput}
            color={textColor}
            borderColor={borderColor}
            _focus={{ borderColor: "pink.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}