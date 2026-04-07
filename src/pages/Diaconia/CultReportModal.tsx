import { useState, useEffect, FormEvent, useCallback } from 'react';
import Swal from '../../utils/swalConfig';
import api from '../../services/api';
import type { CultReport, CultReportFormData } from '../../types';
import Modal from '../../components/Modal';
import './CultReportModal.css';

interface CultReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingReport?: CultReport | null;
}

const defaultLideranca = () => Array.from({ length: 7 }, () => ({ ministerio: '', lideres: '' }));

const programacaoItems = [
  'Abertura', 'Louvor', 'Dízimos', 'Recados',
  'Palavra', 'Santa Ceia', 'Batismo', 'Apres. de criança'
];

const defaultProgramacao = () => programacaoItems.map(() => ({ descricao: '', horario_inicio: '', horario_termino: '' }));

const defaultFormData = (): CultReportFormData => ({
  cult_type_familia: false,
  cult_type_oracao: false,
  cult_type_adolescentes: false,
  cult_type_outros: false,
  cult_type_outros_texto: '',
  cult_date: new Date().toISOString().split('T')[0],
  horario_inicio: '',
  horario_termino: '',
  ministro: '',
  igreja: '',
  assunto: '',
  texto: '',
  lideranca: defaultLideranca(),
  freq_adultos: 0,
  freq_criancas: 0,
  freq_adolescentes: 0,
  freq_visitantes: 0,
  freq_total: 0,
  diacono_responsavel: '',
  casal_recepcao_1: '',
  casal_recepcao_2: '',
  casal_santa_ceia_1: '',
  casal_santa_ceia_2: '',
  programacao: defaultProgramacao(),
  ocorrencias_gerais: '',
  responsavel: ''
});

export default function CultReportModal({
  isOpen,
  onClose,
  onSuccess,
  editingReport
}: CultReportModalProps) {

  const [formData, setFormData] = useState<CultReportFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingReport) {
      setFormData({
        cult_type_familia: editingReport.cult_type_familia,
        cult_type_oracao: editingReport.cult_type_oracao,
        cult_type_adolescentes: editingReport.cult_type_adolescentes,
        cult_type_outros: editingReport.cult_type_outros,
        cult_type_outros_texto: editingReport.cult_type_outros_texto,
        cult_date: editingReport.cult_date.split('T')[0],
        horario_inicio: editingReport.horario_inicio,
        horario_termino: editingReport.horario_termino,
        ministro: editingReport.ministro,
        igreja: editingReport.igreja,
        assunto: editingReport.assunto,
        texto: editingReport.texto,
        lideranca: editingReport.lideranca.length > 0
          ? [...editingReport.lideranca, ...defaultLideranca().slice(editingReport.lideranca.length)]
          : defaultLideranca(),
        freq_adultos: editingReport.freq_adultos,
        freq_criancas: editingReport.freq_criancas,
        freq_adolescentes: editingReport.freq_adolescentes,
        freq_visitantes: editingReport.freq_visitantes,
        freq_total: editingReport.freq_total,
        diacono_responsavel: editingReport.diacono_responsavel,
        casal_recepcao_1: editingReport.casal_recepcao_1,
        casal_recepcao_2: editingReport.casal_recepcao_2,
        casal_santa_ceia_1: editingReport.casal_santa_ceia_1,
        casal_santa_ceia_2: editingReport.casal_santa_ceia_2,
        programacao: editingReport.programacao.length > 0
          ? [...editingReport.programacao, ...defaultProgramacao().slice(editingReport.programacao.length)]
          : defaultProgramacao(),
        ocorrencias_gerais: editingReport.ocorrencias_gerais,
        responsavel: editingReport.responsavel
      });
    } else {
      setFormData(defaultFormData());
    }
    setErrors({});
  }, [editingReport, isOpen]);

  const calcTotal = useCallback((data: CultReportFormData) => {
    return data.freq_adultos + data.freq_criancas + data.freq_adolescentes + data.freq_visitantes;
  }, []);

  const handleChange = (field: keyof CultReportFormData, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (['freq_adultos', 'freq_criancas', 'freq_adolescentes', 'freq_visitantes'].includes(field)) {
        updated.freq_total = calcTotal(updated);
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLiderancaChange = (index: number, field: 'ministerio' | 'lideres', value: string) => {
    setFormData(prev => {
      const newLideranca = [...prev.lideranca];
      newLideranca[index] = { ...newLideranca[index], [field]: value };
      return { ...prev, lideranca: newLideranca };
    });
  };

  const handleProgramacaoChange = (index: number, field: 'descricao' | 'horario_inicio' | 'horario_termino', value: string) => {
    setFormData(prev => {
      const newProg = [...prev.programacao];
      newProg[index] = { ...newProg[index], [field]: value };
      return { ...prev, programacao: newProg };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.cult_date) newErrors.cult_date = 'Data do culto é obrigatória';
    if (!formData.ministro.trim()) newErrors.ministro = 'Ministro é obrigatório';
    if (!formData.assunto.trim()) newErrors.assunto = 'Assunto é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({ icon: 'error', title: 'Erro!', text: 'Por favor, corrija os erros no formulário' });
      return;
    }
    setLoading(true);
    try {
      if (editingReport) {
        await api.put(`/cult-reports/${editingReport.id}`, formData);
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Relatório atualizado com sucesso!' });
      } else {
        await api.post('/cult-reports', formData);
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Relatório criado com sucesso!' });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Erro!', text: error.response?.data?.error || 'Erro ao salvar relatório' });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
        Cancelar
      </button>
      <button type="submit" form="cult-report-form" className="btn btn-primary" disabled={loading}>
        {loading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Culto"
      subtitle="Igreja Cristã da Família Aparecida"
      footer={footer}
      maxWidth="1400px"
    >
      <form id="cult-report-form" onSubmit={handleSubmit}>
        <div className="cult-report-content">

            {/* TOPO: Checkboxes + Data/Horário */}
            <div className="topo-section">
              <div className="col-check">
                <label className="check-label">
                  <input type="checkbox" checked={formData.cult_type_familia} onChange={e => handleChange('cult_type_familia', e.target.checked)} />
                  Culto da Família (Domingo)
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={formData.cult_type_oracao} onChange={e => handleChange('cult_type_oracao', e.target.checked)} />
                  Culto de Oração (Quarta-feira)
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={formData.cult_type_adolescentes} onChange={e => handleChange('cult_type_adolescentes', e.target.checked)} />
                  Culto de Adolescentes (Sábado)
                </label>
                <div className="outros-wrap">
                  <label className="check-label">
                    <input type="checkbox" checked={formData.cult_type_outros} onChange={e => handleChange('cult_type_outros', e.target.checked)} />
                    Outros:
                  </label>
                  <input type="text" value={formData.cult_type_outros_texto} onChange={e => handleChange('cult_type_outros_texto', e.target.value)} placeholder="especificar..." />
                </div>
              </div>
              <div className="col-data">
                <div className="data-row">
                  <span>Data:</span>
                  <input type="date" value={formData.cult_date} onChange={e => handleChange('cult_date', e.target.value)} className={errors.cult_date ? 'error' : ''} />
                </div>
                {errors.cult_date && <span className="error-message">{errors.cult_date}</span>}
                <div className="data-row">
                  <span>Horário de Início:</span>
                  <input type="time" value={formData.horario_inicio} onChange={e => handleChange('horario_inicio', e.target.value)} />
                </div>
                <div className="data-row">
                  <span>Horário de Término:</span>
                  <input type="time" value={formData.horario_termino} onChange={e => handleChange('horario_termino', e.target.value)} />
                </div>
              </div>
            </div>

            <hr className="sep" />

            {/* Ministro / Igreja */}
            <div className="linha-dupla">
              <div className="campo">
                <span>Ministro da Palavra:</span>
                <input type="text" value={formData.ministro} onChange={e => handleChange('ministro', e.target.value)} placeholder="Nome do ministro" className={errors.ministro ? 'error' : ''} />
              </div>
              {errors.ministro && <span className="error-message">{errors.ministro}</span>}
              <div className="campo">
                <span>Igreja:</span>
                <input type="text" value={formData.igreja} onChange={e => handleChange('igreja', e.target.value)} placeholder="Nome da igreja" />
              </div>
            </div>

            {/* Assunto / Texto */}
            <div className="linha-dupla">
              <div className="campo">
                <span>Assunto:</span>
                <input type="text" value={formData.assunto} onChange={e => handleChange('assunto', e.target.value)} placeholder="Tema da pregação" className={errors.assunto ? 'error' : ''} />
              </div>
              {errors.assunto && <span className="error-message">{errors.assunto}</span>}
              <div className="campo">
                <span>Texto:</span>
                <input type="text" value={formData.texto} onChange={e => handleChange('texto', e.target.value)} placeholder="Referência bíblica" />
              </div>
            </div>

            <hr className="sep" />

            {/* LIDERANÇA */}
            <div className="secao-titulo">Integrantes da liderança presentes:</div>
            {formData.lideranca.map((item, i) => (
              <div className="lideranca-row" key={i}>
                <div className="campo">
                  <span>Ministério:</span>
                  <input type="text" value={item.ministerio} onChange={e => handleLiderancaChange(i, 'ministerio', e.target.value)} placeholder="Nome do ministério" />
                </div>
                <div className="campo">
                  <span>Líderes:</span>
                  <input type="text" value={item.lideres} onChange={e => handleLiderancaChange(i, 'lideres', e.target.value)} placeholder="Nome dos líderes" />
                </div>
              </div>
            ))}

            <hr className="sep" />

            {/* FREQUÊNCIA */}
            <div className="secao-titulo">Frequência:</div>
            <div className="freq-row">
              <div className="campo">
                <span>Adultos:</span>
                <input type="number" value={formData.freq_adultos || ''} onChange={e => handleChange('freq_adultos', parseInt(e.target.value) || 0)} min="0" className="inp-num" />
              </div>
              <div className="campo">
                <span>Crianças:</span>
                <input type="number" value={formData.freq_criancas || ''} onChange={e => handleChange('freq_criancas', parseInt(e.target.value) || 0)} min="0" className="inp-num" />
              </div>
              <div className="campo">
                <span>Adolescentes:</span>
                <input type="number" value={formData.freq_adolescentes || ''} onChange={e => handleChange('freq_adolescentes', parseInt(e.target.value) || 0)} min="0" className="inp-num" />
              </div>
              <div className="campo">
                <span>Visitantes:</span>
                <input type="number" value={formData.freq_visitantes || ''} onChange={e => handleChange('freq_visitantes', parseInt(e.target.value) || 0)} min="0" className="inp-num" />
              </div>
              <div className="campo total-campo">
                <span>Total:</span>
                <input type="number" value={formData.freq_total || ''} readOnly className="inp-num readonly" />
              </div>
            </div>

            <hr className="sep" />

            {/* ESCALAS DO DIA */}
            <div className="secao-titulo">Escalas do dia:</div>
            <div className="escala-row">
              <span>Diácono responsável:</span>
              <input type="text" value={formData.diacono_responsavel} onChange={e => handleChange('diacono_responsavel', e.target.value)} placeholder="Nome do diácono" />
            </div>
            <div className="escala-row">
              <span>Casal de Recepção:</span>
              <input type="text" value={formData.casal_recepcao_1} onChange={e => handleChange('casal_recepcao_1', e.target.value)} placeholder="Nome" />
              <span className="e-sep">e</span>
              <input type="text" value={formData.casal_recepcao_2} onChange={e => handleChange('casal_recepcao_2', e.target.value)} placeholder="Nome" />
            </div>
            <div className="escala-row">
              <span>Casal da Santa Ceia:</span>
              <input type="text" value={formData.casal_santa_ceia_1} onChange={e => handleChange('casal_santa_ceia_1', e.target.value)} placeholder="Nome" />
              <span className="e-sep">e</span>
              <input type="text" value={formData.casal_santa_ceia_2} onChange={e => handleChange('casal_santa_ceia_2', e.target.value)} placeholder="Nome" />
            </div>

            <hr className="sep" />

            {/* PROGRAMAÇÃO DO CULTO */}
            <div className="secao-titulo">Programação do Culto:</div>
            {formData.programacao.map((item, i) => (
              <div className="prog-row" key={i}>
                <span className="label">{programacaoItems[i]}:</span>
                <input type="text" value={item.descricao} onChange={e => handleProgramacaoChange(i, 'descricao', e.target.value)} placeholder="Responsável / descrição" className="inp-desc" />
                <span className="hora-label">Início:</span>
                <input type="time" value={item.horario_inicio} onChange={e => handleProgramacaoChange(i, 'horario_inicio', e.target.value)} className="inp-hora" />
                <span className="hora-label">Término:</span>
                <input type="time" value={item.horario_termino} onChange={e => handleProgramacaoChange(i, 'horario_termino', e.target.value)} className="inp-hora" />
              </div>
            ))}

            <hr className="sep" />

            {/* OCORRÊNCIAS GERAIS */}
            <div className="secao-titulo">Ocorrências Gerais:</div>
            <textarea
              value={formData.ocorrencias_gerais}
              onChange={e => handleChange('ocorrencias_gerais', e.target.value)}
              placeholder="Descreva as ocorrências gerais do culto..."
              rows={4}
              className="ocorrencias-textarea"
            />

            {/* RESPONSÁVEL */}
            <div className="responsavel-row">
              <span>Responsável pelo relatório:</span>
              <input type="text" value={formData.responsavel} onChange={e => handleChange('responsavel', e.target.value)} placeholder="Nome do responsável" />
            </div>
        </div>
      </form>
    </Modal>
  );
}
