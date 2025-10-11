-- Check which policies exist on the groepen table
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
WHERE tablename IN ('groepen', 'structuren', 'afdelingen')
ORDER BY tablename, policyname;

-- Also check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('groepen', 'structuren', 'afdelingen');

