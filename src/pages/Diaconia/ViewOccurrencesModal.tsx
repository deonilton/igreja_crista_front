import { useState } from 'react';
import { FiX, FiFileText, FiPrinter, FiAlertCircle, FiCalendar, FiUser, FiMapPin } from 'react-icons/fi';

interface ViewOccurrencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrences: any[];
  loading: boolean;
}

import './ViewOccurrencesModal.css';

export default function ViewOccurrencesModal({ 
  isOpen, 
  onClose, 
  occurrences, 
  loading 
}: ViewOccurrencesModalProps) {
  
  const handlePrint = () => {
    const printContent = document.getElementById('occurrences-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ocorrências - Igreja Cristã</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .occurrence-item { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #ddd; padding: 20px; }
            .occurrence-header { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; }
            .occurrence-id { background: #333; color: white; padding: 5px 10px; border-radius: 3px; }
            .field { margin-bottom: 8px; }
            .field strong { color: #333; }
            .description { background: #f5f5f5; padding: 15px; border-left: 4px solid #333; margin-top: 10px; }
            .no-occurrences { text-align: center; color: #666; font-style: italic; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content view-occurrences-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>Ocorrências Registradas</h2>
          </div>
          <div 
              className="modal-header-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
            <button 
              className="modal-print-btn print-button-visible" 
              onClick={handlePrint}
            >
              <FiPrinter />
              Imprimir
            </button>
            <button 
              className="modal-close-btn" 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                color: '#6b7280',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1.1rem'
              }}
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando ocorrências...</p>
            </div>
          ) : occurrences.length > 0 ? (
            <div className="occurrences-container">
              <div id="occurrences-print-content">
                <div className="print-header">
                  <h1>Igreja Cristã - Relatório de Ocorrências</h1>
                  <p>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
                
                {occurrences.map((occurrence) => (
                  <div key={occurrence.id} className="occurrence-item">
                    <div className="occurrence-header">
                      <span className="occurrence-id">#{occurrence.id}</span>
                      <span className="occurrence-date">
                        {new Date(occurrence.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="occurrence-content">
                      <div className="field">
                        <strong>Responsável:</strong> {occurrence.reporter_name}
                      </div>
                      
                      <div className="field">
                        <strong>Local:</strong> {occurrence.location}
                      </div>
                      
                      {occurrence.witnesses && (
                        <div className="field">
                          <strong>Testemunhas:</strong> {occurrence.witnesses}
                        </div>
                      )}
                      
                      <div className="description">
                        <strong>Histórico da ocorrência:</strong> {occurrence.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-occurrences">
              <h3>Nenhuma ocorrência registrada</h3>
              <p>Não há ocorrências para visualizar no momento.</p>
            </div>
          )}
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
