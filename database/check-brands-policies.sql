-- Check how brands table policies are configured (since they work)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('brands', 'categories', 'models', 'radios')
ORDER BY tablename, policyname;

