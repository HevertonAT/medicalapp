import React from "react";
import { 
  FormControl, FormLabel, Input, VStack, Heading, SimpleGrid, Textarea, Box, Divider 
} from "@chakra-ui/react";

export default function OftalmologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="teal.500">
        Exame Oftalmológico Completo
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={8}>
        {/* Coluna Olho Direito (OD) */}
        <VStack align="stretch" spacing={4}>
          <Heading size="xs" color={textColor} borderBottom="2px solid" borderColor="teal.400" pb={1} w="fit-content">
            Olho Direito (OD)
          </Heading>
          <FormControl>
            <FormLabel fontSize="sm" color={textColor}>Acuidade Visual</FormLabel>
            <Input 
              name="od_acuidade" 
              value={formData.od_acuidade || ""} 
              onChange={handleChange} 
              placeholder="Ex: 20/20" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color={textColor}>Pressão Intraocular (PIO)</FormLabel>
            <Input 
              name="od_pressao" 
              value={formData.od_pressao || ""} 
              onChange={handleChange} 
              placeholder="Ex: 14 mmHg" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
          </FormControl>
        </VStack>

        {/* Coluna Olho Esquerdo (OE) */}
        <VStack align="stretch" spacing={4}>
          <Heading size="xs" color={textColor} borderBottom="2px solid" borderColor="teal.400" pb={1} w="fit-content">
            Olho Esquerdo (OE)
          </Heading>
          <FormControl>
            <FormLabel fontSize="sm" color={textColor}>Acuidade Visual</FormLabel>
            <Input 
              name="oe_acuidade" 
              value={formData.oe_acuidade || ""} 
              onChange={handleChange} 
              placeholder="Ex: 20/20" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color={textColor}>Pressão Intraocular (PIO)</FormLabel>
            <Input 
              name="oe_pressao" 
              value={formData.oe_pressao || ""} 
              onChange={handleChange} 
              placeholder="Ex: 14 mmHg" 
              bg={bgInput} 
              color={textColor} 
              borderColor={borderColor}
              _focus={{ borderColor: "teal.400" }}
            />
          </FormControl>
        </VStack>
      </SimpleGrid>

      <Divider borderColor={borderColor} />

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Biomicroscopia / Mapeamento de Retina</FormLabel>
        <Textarea 
          name="oftalmo_detalhes" 
          value={formData.oftalmo_detalhes || ""} 
          onChange={handleChange} 
          placeholder="Descreva achados em córnea, cristalino, vítreo, retina, disco óptico e mácula..."
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          resize="none"
          minH="180px"
          _focus={{ borderColor: "teal.400" }}
        />
      </FormControl>
    </VStack>
  );
}