namespace SmartCampus.Application.DTOs.Common
{
    public class PaginationQuery
    {
        private const int MaxPageSize = 50;
        private int _pageSize = 10;

        public int Page { get; set; } = 1;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value <= 0 ? 10 : Math.Min(value, MaxPageSize);
        }

        public int Skip => (Math.Max(Page, 1) - 1) * PageSize;
        public int SafePage => Math.Max(Page, 1);
    }
}
