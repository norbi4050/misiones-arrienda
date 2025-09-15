-- Corrección de nombres de columnas para políticas RLS en Supabase

-- Habilitar RLS en tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles: solo el usuario puede ver/editar su perfil
CREATE POLICY "Profiles: select own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para properties: lectura pública si AVAILABLE e is_paid=true
CREATE POLICY "Properties: select available and paid" ON properties
  FOR SELECT USING (status = 'AVAILABLE' AND is_paid = true);

-- Políticas para properties: CRUD solo para dueño o admin
CREATE POLICY "Properties: owner or admin" ON properties
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Políticas para payments: solo el usuario dueño o admin puede ver
CREATE POLICY "Payments: owner or admin" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Políticas para subscriptions: solo el usuario dueño o admin puede ver
CREATE POLICY "Subscriptions: owner or admin" ON subscriptions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
