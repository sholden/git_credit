class IndexReader
  include Enumerable

  attr_reader :repository, :rugged, :linguist

  def initialize(repository)
    @repository = repository
    @rugged = Rugged::Repository.new(@repository.path)
    @linguist = Linguist::Repository.new(@rugged, @rugged.last_commit.oid)
  end

  def each
    if block_given?
      rugged.index.each do |blob|
        extra_attrs = {}

        language_info = linguist.cache[blob[:path]]
        if language_info
          language_name, relevant_lines = language_info
          language = Linguist::Language.find_by_name(language_name)
          extra_attrs.merge!(language: {
                                 name: language_name,
                                 relevant_lines: relevant_lines,
                                 ace_mode: language.ace_mode
                             })
        end

        yield IndexObject.new(blob.merge!(extra_attrs))
      end
    else
      to_enum(:each)
    end
  end
end