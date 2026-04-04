'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, ShoppingCart, ArrowRight, Loader2, BookOpen, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/carrinho');
      return;
    }
    
    if (user) {
      fetchCart();
    }
  }, [user, authLoading, router]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setIsRemoving(id);
    try {
      const res = await fetch(`/api/cart?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCartItems(prev => prev.filter(item => item.id !== id));
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        alert('Erro ao remover item.');
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setIsRemoving(null);
    }
  };

  const total = cartItems.reduce((acc, item) => {
    const price = typeof item.courses?.price === 'number' ? item.courses.price : parseFloat(item.courses?.price || '0');
    return acc + price;
  }, 0);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50">

      <main className="w-full max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="mb-8 border-b border-stone-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
              <ShoppingCart size={28} className="text-primary-600" />
              Meu Carrinho
            </h1>
            <p className="text-stone-500 mt-2">Revise seus itens antes de finalizar a compra.</p>
          </div>
          <div className="hidden sm:block">
            <span className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full font-bold text-sm border border-primary-200 shadow-sm">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {isLoading || authLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-primary-600" size={40} />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-6">
              <ShoppingCart size={48} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Seu carrinho está vazio</h2>
            <p className="text-stone-500 mb-8 max-w-md">Parece que você ainda não adicionou nenhum curso ao seu carrinho. Explore nossas trilhas e comece a aprender hoje mesmo!</p>
            <Link 
              href="/trilhas" 
              className="bg-primary-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-700 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-lg shadow-primary-600/30 flex items-center gap-2"
            >
              <BookOpen size={20} /> Explorar Trilhas
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-6 relative group transition-all hover:border-primary-200">
                  <div className="w-full sm:w-48 h-32 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    {item.courses?.thumbnail_url ? (
                      <img src={item.courses.thumbnail_url} alt={item.courses.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <BookOpen size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 uppercase tracking-wide">
                          {item.courses?.level || 'Curso'}
                        </span>
                        <span className="font-bold text-lg text-stone-900 hidden sm:block">
                          {(typeof item.courses?.price === 'number' ? item.courses.price : parseFloat(item.courses?.price || '0')) > 0 ? 
                            `R$ ${(typeof item.courses?.price === 'number' ? item.courses.price : parseFloat(item.courses?.price || '0')).toFixed(2).replace('.', ',')}` 
                            : 'Gratuito'
                          }
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-stone-900 line-clamp-2 mt-2 group-hover:text-primary-700 transition-colors">
                        {item.courses?.title || 'Curso Indisponível'}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 border-t border-stone-100 pt-4">
                      <button 
                        onClick={() => removeItem(item.id)}
                        disabled={isRemoving === item.id}
                        className="text-stone-500 hover:text-red-500 text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isRemoving === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Remover
                      </button>
                      <span className="font-bold text-lg text-stone-900 sm:hidden">
                        {(typeof item.courses?.price === 'number' ? item.courses.price : parseFloat(item.courses?.price || '0')) > 0 ? 
                          `R$ ${(typeof item.courses?.price === 'number' ? item.courses.price : parseFloat(item.courses?.price || '0')).toFixed(2).replace('.', ',')}` 
                          : 'Gratuito'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 lg:sticky lg:top-28">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-6 border-b border-stone-100 pb-6">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal ({cartItems.length} itens)</span>
                  <span className="font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Descontos</span>
                  <span className="font-medium text-green-600">- R$ 0,00</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold text-stone-800">Total</span>
                <span className="text-3xl font-black text-stone-900">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <button 
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 group"
              >
                Finalizar Compra
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-6 bg-stone-50 rounded-lg p-4 flex gap-3 border border-stone-100 items-start">
                <AlertCircle size={20} className="text-stone-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 leading-relaxed">
                  Garantia de Arrependimento: Você tem até 7 dias para testar a plataforma. Se não gostar, devolvemos 100% do seu dinheiro. Transação 100% segura.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
