using System.Linq.Expressions;

namespace SmartCampus.Application.Interfaces
{
    /// <summary>
    /// Tum entity'ler icin ortak veri erisim soyutlamasi.
    /// EF Core detaylari Infrastructure katmaninda gizlenir.
    /// </summary>
    public interface IGenericRepository<T> where T : class
    {
        Task<IReadOnlyList<T>> GetPagedAsync(
            int skip,
            int take,
            Expression<Func<T, object>> orderBy,
            bool descending,
            CancellationToken cancellationToken = default);

        Task<int> CountAsync(CancellationToken cancellationToken = default);

        Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

        Task AddAsync(T entity, CancellationToken cancellationToken = default);

        void Update(T entity);

        void Remove(T entity);
    }
}
