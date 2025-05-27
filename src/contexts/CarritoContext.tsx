import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CarritoContextType {
  cantidadProductos: number;
  actualizarCantidad: () => Promise<void>;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cantidadProductos, setCantidadProductos] = useState(0);

  // Función para actualizar la cantidad de productos en el carrito
  const actualizarCantidad = async () => {
    try {
      // Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Si está autenticado, obtener los productos del carrito desde Supabase
        const { data: carritos } = await supabase
          .from("carritos")
          .select("id")
          .eq("usuario_id", session.user.id)
          .single();
        
        if (carritos) {
          const { data: items } = await supabase
            .from("carrito_items")
            .select("cantidad")
            .eq("carrito_id", carritos.id);
          
          if (items && items.length > 0) {
            // Sumar todas las cantidades
            const total = items.reduce((sum, item) => sum + item.cantidad, 0);
            setCantidadProductos(total);
            return;
          }
        }
        
        // Si no hay carrito o está vacío
        setCantidadProductos(0);
      } else {
        // Si no está autenticado, obtener los productos del localStorage
        const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
        const total = carritoLocal.reduce((sum, item) => sum + item.cantidad, 0);
        setCantidadProductos(total);
      }
    } catch (error) {
      console.error("Error al actualizar cantidad del carrito:", error);
      // En caso de error, intentar obtener del localStorage
      const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
      const total = carritoLocal.reduce((sum, item) => sum + item.cantidad, 0);
      setCantidadProductos(total);
    }
  };

  // Actualizar la cantidad al cargar el componente
  useEffect(() => {
    actualizarCantidad();
    
    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      actualizarCantidad();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <CarritoContext.Provider value={{ cantidadProductos, actualizarCantidad }}>
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = (): CarritoContextType => {
  const context = useContext(CarritoContext);
  if (context === undefined) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};
