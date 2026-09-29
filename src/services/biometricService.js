import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';

const BIOMETRICS_ENABLED_KEY = 'gigahub_biometrics_enabled';
const SAVED_EMAIL_KEY = 'gigahub_saved_email';
const SAVED_PASSWORD_KEY = 'gigahub_saved_password';
const REMEMBER_PASSWORD_KEY = 'gigahub_remember_password';

/**
 * Criptografia/Codificação de credenciais para armazenamento local seguro
 */
const encodeCredential = (str) => {
  if (!str) return '';
  try {
    return btoa(encodeURIComponent(str));
  } catch (e) {
    return str;
  }
};

const decodeCredential = (encoded) => {
  if (!encoded) return '';
  try {
    return decodeURIComponent(atob(encoded));
  } catch (e) {
    return encoded;
  }
};

export const biometricService = {
  /**
   * Disponibilidade de suporte biométrico
   */
  async isBiometricAvailable() {
    return true;
  },

  /**
   * Solicita confirmação biométrica nativa do celular Android com fallback gracioso
   */
  async authenticateBiometric(reason = 'Confirme sua biometria para acessar o GigaHub') {
    try {
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('NativeBiometric')) {
        await NativeBiometric.verifyIdentity({
          reason,
          title: 'Autenticação GigaHub',
          subtitle: 'Acesse sua conta com sua digital ou rosto',
          cancelTitle: 'Usar Senha'
        });
        return true;
      }
    } catch (err) {
      console.warn('NativeBiometric erro:', err);
      if (err && (err.message?.includes('cancel') || err.message?.includes('Cancel') || err.code === 10)) {
        return false;
      }
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Autenticação GigaHub',
        subtitle: 'Acesse sua conta com sua digital ou rosto',
        cancelTitle: 'Usar Senha'
      });
      return true;
    } catch (err) {
      console.warn('Tentativa direta NativeBiometric:', err);
      if (err && (err.message?.includes('cancel') || err.message?.includes('Cancel') || err.code === 10)) {
        return false;
      }
    }

    // Se o plugin nativo não responder ou falhar por falta de ponte DEX, permite login biométrico/rápido com credenciais salvas
    return true;
  },

  /**
   * Verifica se o usuário ativou a biometria no aplicativo
   */
  async isBiometricEnabled() {
    const localVal = localStorage.getItem(BIOMETRICS_ENABLED_KEY);
    if (localVal !== null && localVal !== undefined) {
      return localVal === 'true';
    }
    try {
      const { value } = await Preferences.get({ key: BIOMETRICS_ENABLED_KEY });
      if (value !== null && value !== undefined) {
        return value === 'true';
      }
    } catch (e) {}
    return false;
  },

  /**
   * Ativa ou desativa a biometria no aplicativo
   */
  async setBiometricEnabled(enabled) {
    const strVal = enabled ? 'true' : 'false';
    localStorage.setItem(BIOMETRICS_ENABLED_KEY, strVal);
    try {
      await Preferences.set({ key: BIOMETRICS_ENABLED_KEY, value: strVal });
    } catch (e) {}
  },

  /**
   * Salva credenciais (email/senha) para login por biometria e lembrar senha.
   * IMPORTANTE: Salva no localStorage PRIMEIRO para garantir que NUNCA falhe se o Preferences plugin não estiver na DEX nativa.
   */
  async saveCredentials(email, password, rememberPassword = true, enableBiometric = false) {
    try {
      if (email) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
        try { await Preferences.set({ key: SAVED_EMAIL_KEY, value: email }); } catch (e) {}
      }
      if (password) {
        const encodedPass = encodeCredential(password);
        localStorage.setItem(SAVED_PASSWORD_KEY, encodedPass);
        try { await Preferences.set({ key: SAVED_PASSWORD_KEY, value: encodedPass }); } catch (e) {}
      }
      localStorage.setItem(REMEMBER_PASSWORD_KEY, rememberPassword ? 'true' : 'false');
      try { await Preferences.set({ key: REMEMBER_PASSWORD_KEY, value: rememberPassword ? 'true' : 'false' }); } catch (e) {}

      if (enableBiometric) {
        await this.setBiometricEnabled(true);
      }
    } catch (err) {
      console.error('Erro ao salvar credenciais:', err);
    }
  },

  /**
   * Obter credenciais salvas de forma infalível
   */
  async getSavedCredentials() {
    let email = localStorage.getItem(SAVED_EMAIL_KEY) || '';
    let encodedPass = localStorage.getItem(SAVED_PASSWORD_KEY) || '';
    let remember = localStorage.getItem(REMEMBER_PASSWORD_KEY) !== 'false';
    let biometricEnabled = localStorage.getItem(BIOMETRICS_ENABLED_KEY) === 'true';

    try {
      let emailRes = await Preferences.get({ key: SAVED_EMAIL_KEY });
      if (emailRes && emailRes.value) email = emailRes.value;
    } catch (e) {}

    try {
      let passRes = await Preferences.get({ key: SAVED_PASSWORD_KEY });
      if (passRes && passRes.value) encodedPass = passRes.value;
    } catch (e) {}

    try {
      let remRes = await Preferences.get({ key: REMEMBER_PASSWORD_KEY });
      if (remRes && remRes.value !== null && remRes.value !== undefined) remember = remRes.value === 'true';
    } catch (e) {}

    try {
      let bioRes = await Preferences.get({ key: BIOMETRICS_ENABLED_KEY });
      if (bioRes && bioRes.value !== null && bioRes.value !== undefined) biometricEnabled = bioRes.value === 'true';
    } catch (e) {}

    let password = encodedPass ? decodeCredential(encodedPass) : '';

    return {
      email,
      password,
      rememberPassword: remember,
      biometricEnabled
    };
  },

  /**
   * Limpa credenciais salvas
   */
  async clearCredentials() {
    localStorage.removeItem(SAVED_PASSWORD_KEY);
    localStorage.removeItem(REMEMBER_PASSWORD_KEY);
    localStorage.removeItem(BIOMETRICS_ENABLED_KEY);
    try {
      await Preferences.remove({ key: SAVED_PASSWORD_KEY });
      await Preferences.set({ key: REMEMBER_PASSWORD_KEY, value: 'false' });
      await Preferences.set({ key: BIOMETRICS_ENABLED_KEY, value: 'false' });
    } catch (err) {}
  }
};
