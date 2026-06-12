using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Application.Interfaces;
using SmartCampus.Infrastructure.Context;

namespace SmartCampus.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly ApplicationDbContext _context;
        private readonly DbSet<T> _dbSet;

        public GenericRepository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<IReadOnlyList<T>> GetPagedAsync(
            int skip,
            int take,
            Expression<Func<T, object>> orderBy,
            bool descending,
            CancellationToken cancellationToken = default)
        {
            IQueryable<T> query = descending
                ? _dbSet.OrderByDescending(orderBy)
                : _dbSet.OrderBy(orderBy);

            return await query.Skip(skip).Take(take).ToListAsync(cancellationToken);
        }

        public Task<int> CountAsync(CancellationToken cancellationToken = default)
            => _dbSet.CountAsync(cancellationToken);

        public async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
            => await _dbSet.FindAsync(new object?[] { id }, cancellationToken);

        public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
            => _dbSet.FirstOrDefaultAsync(predicate, cancellationToken);

        public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
            => _dbSet.AnyAsync(predicate, cancellationToken);

        public async Task<IReadOnlyList<T>> ListAsync(
            Expression<Func<T, bool>> predicate,
            CancellationToken cancellationToken = default)
            => await _dbSet.Where(predicate).ToListAsync(cancellationToken);

        public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
            => await _dbSet.AddAsync(entity, cancellationToken);

        public void Update(T entity) => _dbSet.Update(entity);

        public void Remove(T entity) => _dbSet.Remove(entity);
    }
}
